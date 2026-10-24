const nodemailer = require('nodemailer');

const MAX_SEND_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'ECONNRESET', 'ECONNREFUSED',
  'EPIPE', 'EAI_AGAIN', 'ENOTFOUND', 'EPROTOCOL'
]);

class EmailSendError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'EmailSendError';
    this.code = 'EMAIL_SEND_FAILED';
    this.status = 503;
    this.cause = cause;
  }
}

function isTransientError(err) {
  if (!err) return false;
  if (TRANSIENT_ERROR_CODES.has(err.code)) return true;
  // Respostas SMTP 4xx são temporárias (ex.: limite de envio, greylisting)
  return Number(err.responseCode) >= 400 && Number(err.responseCode) < 500;
}

function maskEmail(address) {
  const value = String(address || '');
  const [local, domain] = value.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  }

  getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      throw new EmailSendError('Servico de email nao configurado.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 15000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 15000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 30000)
    });

    return this.transporter;
  }

  resetTransporter() {
    if (this.transporter && typeof this.transporter.close === 'function') {
      try { this.transporter.close(); } catch (_) { /* ignorar */ }
    }
    this.transporter = null;
  }

  async sendMail({ to, subject, text, html }) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    let lastError;

    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
      try {
        const transporter = this.getTransporter();
        const info = await transporter.sendMail({ from, to, subject, text, html });

        if (Array.isArray(info.rejected) && info.rejected.length > 0) {
          const rejected = new Error(`Destinatario rejeitado pelo servidor SMTP: ${info.response || ''}`);
          rejected.code = 'EENVELOPE';
          throw rejected;
        }

        console.info(`[email] enviado para ${maskEmail(to)} (tentativa ${attempt}) id=${info.messageId}`);
        return info;
      } catch (err) {
        if (err instanceof EmailSendError) throw err;
        lastError = err;
        const transient = isTransientError(err);
        console.error(
          `[email] falha ao enviar para ${maskEmail(to)} (tentativa ${attempt}/${MAX_SEND_ATTEMPTS}):`,
          err.code || '', err.responseCode || '', err.message
        );

        // Recria a ligação na próxima tentativa
        this.resetTransporter();

        if (!transient || attempt === MAX_SEND_ATTEMPTS) break;
        await this.sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }

    throw new EmailSendError('Nao foi possivel enviar o email. Tente novamente dentro de instantes.', lastError);
  }

  async sendTwoFactorCode({ to, name, code }) {
    const platformName = process.env.PLATFORM_NAME || 'Romenapay';
    const subject = `${platformName} - Codigo de verificacao`;
    const greeting = name ? `Ola ${name},` : 'Ola,';

    return this.sendMail({
      to,
      subject,
      text: `${greeting}\n\nO seu codigo de verificacao e: ${code}\n\nEste codigo expira em 5 minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <p>${greeting}</p>
          <p>Use o codigo abaixo para concluir a verificacao:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${code}</p>
          <p>Este codigo expira em 5 minutos.</p>
        </div>
      `
    });
  }

  async sendPasswordReset({ to, name, resetUrl, token }) {
    const platformName = process.env.PLATFORM_NAME || 'Romenapay';
    const subject = `${platformName} - Redefinicao de senha`;
    const greeting = name ? `Ola ${name},` : 'Ola,';

    return this.sendMail({
      to,
      subject,
      text: `${greeting}\n\nUse o link abaixo para redefinir a sua senha:\n${resetUrl}\n\nSe nao foi voce, ignore este email.\n\nToken: ${token}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <p>${greeting}</p>
          <p>Recebemos um pedido para redefinir a sua senha.</p>
          <p><a href="${resetUrl}" style="display: inline-block; background: #1f2937; color: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">Redefinir senha</a></p>
          <p>Se o botao nao funcionar, copie este link:</p>
          <p style="word-break: break-all; font-size: 12px; color: #4b5563;">${resetUrl}</p>
          <p>Se nao foi voce, ignore este email.</p>
        </div>
      `
    });
  }
}

module.exports = new EmailService();
module.exports.EmailSendError = EmailSendError;