const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

function safeUuid() {
  if (typeof crypto.randomUUID === 'function') {
    try { return crypto.randomUUID(); } catch (_) { /* fallback */ }
  }
  return crypto.randomBytes(16).toString('hex');
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
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 30000),
      name: process.env.SMTP_EHLO_NAME || undefined,
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
      }
    });

    return this.transporter;
  }

  resetTransporter() {
    if (this.transporter && typeof this.transporter.close === 'function') {
      try { this.transporter.close(); } catch (_) { /* ignorar */ }
    }
    this.transporter = null;
  }

  async sendMail({ to, subject, text }) {
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      const err = new EmailSendError('Destinatário inválido ou ausente.');
      console.error('[EMAIL ERROR]', err.message, { to });
      throw err;
    }

    const safeSubject = typeof subject === 'string'
      ? subject.replace(/[\r\n]+/g, ' ').trim()
      : '';
    if (!safeSubject) {
      const err = new EmailSendError(
        'Assunto do email vazio — envio bloqueado para evitar emails em branco.'
      );
      console.error('[EMAIL ERROR]', err.message, { to, subject });
      throw err;
    }

    const safeText = typeof text === 'string'
      ? text.replace(/\r\n?/g, '\n').trim()
      : '';
    if (!safeText) {
      const err = new EmailSendError(
        'Corpo do email vazio — envio bloqueado.'
      );
      console.error('[EMAIL ERROR]', err.message, { to, subject });
      throw err;
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!fromAddress) {
      throw new EmailSendError('SMTP_FROM/SMTP_USER não configurado.');
    }

    const from = /</.test(fromAddress)
      ? fromAddress
      : { name: getPlatformName(), address: fromAddress };

    const replyTo = process.env.SMTP_REPLY_TO?.trim() || undefined;

    let lastError;

    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
      try {
        const transporter = this.getTransporter();
        const mailOptions = {
          from,
          to,
          subject: safeSubject,
          text: safeText,
          headers: {
            // UUID novo por tentativa — evita que o Gmail agrupe os códigos numa conversa e oculte o corpo repetido
            'X-Entity-Ref-ID': safeUuid()
          }
        };
        if (replyTo) mailOptions.replyTo = replyTo;

        const info = await transporter.sendMail(mailOptions);

        if (Array.isArray(info.rejected) && info.rejected.length > 0) {
          const rejected = new Error(
            `Destinatario rejeitado pelo servidor SMTP: ${info.response || ''}`
          );
          rejected.code = 'EENVELOPE';
          throw rejected;
        }

        if (!Array.isArray(info.accepted) || info.accepted.length === 0) {
          const unaccepted = new Error(
            `Destinatario nao aceito pelo servidor SMTP: ${info.response || ''}`
          );
          unaccepted.code = 'EENVELOPE';
          throw unaccepted;
        }

        console.info(
          `[email] enviado para ${maskEmail(to)} (tentativa ${attempt}) id=${info.messageId}`
        );
        return info;
      } catch (err) {
        if (err instanceof EmailSendError) throw err;
        lastError = err;
        const transient = isTransientError(err);
        console.error(
          `[email] falha ao enviar para ${maskEmail(to)} (tentativa ${attempt}/${MAX_SEND_ATTEMPTS}):`,
          err.code || '',
          err.responseCode || '',
          err.message
        );

        this.resetTransporter();

        if (!transient || attempt === MAX_SEND_ATTEMPTS) break;
        await this.sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }

    throw new EmailSendError(
      'Nao foi possivel enviar o email. Tente novamente dentro de instantes.',
      lastError
    );
  }

  async sendTwoFactorCode({ to, name, code, purpose = 'login' }) {
    if (!code || String(code).trim() === '') {
      throw new EmailSendError(
        'Código de verificação ausente — email de OTP não enviado.'
      );
    }

    const platformName = getPlatformName();
    const isRegistration = purpose === 'registration';
    const safeCode = String(code).trim();
    const subject = isRegistration
      ? `Confirme o seu email - ${platformName}`
      : `Código de acesso - ${platformName}`;
    const intro = isRegistration
      ? `Use o código abaixo para confirmar o seu email e concluir a criação da conta na ${platformName}.`
      : `Use o código abaixo para concluir o início de sessão na sua conta ${platformName}.`;
    const greeting = name ? `Olá ${name},` : 'Olá,';

    return this.sendMail({
      to,
      subject,
      text: [
        greeting,
        '',
        intro,
        '',
        `Código de verificação: ${safeCode}`,
        '',
        'Este código expira em 5 minutos e só pode ser usado uma vez.',
        'Se não foi você que fez este pedido, ignore este email e não partilhe o código com ninguém.',
        '',
        `Equipa ${platformName}`
      ].join('\n'),
    });
  }

  async sendPasswordReset({ to, name, resetUrl }) {
    if (!resetUrl || typeof resetUrl !== 'string' || !resetUrl.trim()) {
      throw new EmailSendError(
        'URL de redefinição ausente — email de reset não enviado.'
      );
    }

    const platformName = getPlatformName();
    const subject = `Redefinição da sua senha ${platformName}`;
    const greeting = name ? `Olá ${name},` : 'Olá,';

    return this.sendMail({
      to,
      subject,
      text: [
        greeting,
        '',
        `Recebemos um pedido para redefinir a senha da sua conta ${platformName}.`,
        'Abra o link abaixo para escolher uma nova senha (válido durante 1 hora):',
        resetUrl,
        '',
        'Se não foi você que fez este pedido, ignore este email. A sua senha não será alterada.',
        '',
        `Equipa ${platformName}`
      ].join('\n'),
    });
  }
}

function getPlatformName() {
  return process.env.PLATFORM_NAME || 'Romenapay';
}

module.exports = new EmailService();
module.exports.EmailSendError = EmailSendError;