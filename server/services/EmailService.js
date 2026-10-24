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

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

  async sendMail({ to, subject, text, html }) {
    // ── Diagnóstico: expõe imediatamente chamadas defeituosas ─────────
    console.log('[EMAIL DEBUG] sendMail chamado', {
      to,
      subject,
      textLen: typeof text === 'string' ? text.length : null,
      htmlLen: typeof html === 'string' ? html.length : null,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      platform: process.env.PLATFORM_NAME,
    });

    // ── Validações defensivas: nunca enviar email vazio ──────────────
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      const err = new EmailSendError('Destinatário inválido ou ausente.');
      console.error('[EMAIL ERROR]', err.message, { to });
      throw err;
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      const err = new EmailSendError(
        'Assunto do email vazio — envio bloqueado para evitar emails em branco.'
      );
      console.error('[EMAIL ERROR]', err.message, { to, subject });
      throw err;
    }

    const hasText = typeof text === 'string' && text.trim().length > 0;
    const hasHtml = typeof html === 'string' && html.trim().length > 0;

    if (!hasText && !hasHtml) {
      const err = new EmailSendError(
        'Corpo do email vazio (text e html ausentes) — envio bloqueado.'
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

    // Sempre enviar multipart (text + html) — melhora reputação e evita
    // emails "vazios" em clientes que não renderizam HTML.
    const safeText = hasText ? text : stripHtml(html);
    const safeHtml = hasHtml ? html : undefined;

    let lastError;

    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
      try {
        const transporter = this.getTransporter();
        const mailOptions = {
          from,
          to,
          subject,
          text: safeText,
          html: safeHtml,
          headers: {
            'X-Auto-Response-Suppress': 'OOF, AutoReply',
            // UUID novo por tentativa — o servidor não deduplica
            'X-Entity-Ref-ID': safeUuid(),
            'X-Mailer': `${getPlatformName()} Mailer`
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
    // ── Diagnóstico: expõe imediatamente parâmetros em falta ─────────
    console.log('[EMAIL DEBUG] sendTwoFactorCode chamado', {
      to,
      name: name ? '***' : null,
      codeLen: code ? String(code).length : null,
      purpose,
    });

    if (!code || String(code).trim() === '') {
      throw new EmailSendError(
        'Código de verificação ausente — email de OTP não enviado.'
      );
    }

    const platformName = getPlatformName();
    const isRegistration = purpose === 'registration';
    const safeCode = String(code).trim();
    const subject = isRegistration
      ? `${safeCode} é o seu código para confirmar o email na ${platformName}`
      : `${safeCode} é o seu código de acesso à ${platformName}`;
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
      html: renderEmail({
        platformName,
        title: isRegistration ? 'Confirme o seu email' : 'Código de verificação',
        preheader: `O seu código de verificação é ${safeCode}. Expira em 5 minutos.`,
        body: `
          <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
          <p style="margin:24px 0;font-size:30px;font-weight:700;letter-spacing:8px;font-family:Consolas,monospace;color:#111827;">${escapeHtml(safeCode)}</p>
          <p style="margin:0 0 8px;">Este código expira em 5 minutos e só pode ser usado uma vez.</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">Se não foi você que fez este pedido, ignore este email e não partilhe o código com ninguém.</p>
        `
      })
    });
  }

  async sendPasswordReset({ to, name, resetUrl }) {
    // ── Diagnóstico: expõe imediatamente parâmetros em falta ─────────
    console.log('[EMAIL DEBUG] sendPasswordReset chamado', {
      to,
      name: name ? '***' : null,
      hasResetUrl: !!resetUrl,
    });

    if (!resetUrl || typeof resetUrl !== 'string' || !resetUrl.trim()) {
      throw new EmailSendError(
        'URL de redefinição ausente — email de reset não enviado.'
      );
    }

    const platformName = getPlatformName();
    const subject = `Redefinição da sua senha ${platformName}`;
    const greeting = name ? `Olá ${name},` : 'Olá,';
    const safeUrl = escapeHtml(resetUrl);

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
      html: renderEmail({
        platformName,
        title: 'Redefinição de senha',
        preheader: 'Pedido para redefinir a sua senha. O link é válido durante 1 hora.',
        body: `
          <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 16px;">Recebemos um pedido para redefinir a senha da sua conta ${escapeHtml(platformName)}. O link é válido durante 1 hora.</p>
          <p style="margin:24px 0;"><a href="${safeUrl}" style="display:inline-block;background:#1f2937;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Redefinir senha</a></p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Se o botão não funcionar, copie este link para o navegador:</p>
          <p style="margin:0 0 16px;word-break:break-all;font-size:12px;color:#4b5563;">${safeUrl}</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">Se não foi você que fez este pedido, ignore este email. A sua senha não será alterada.</p>
        `
      })
    });
  }
}

function getPlatformName() {
  return process.env.PLATFORM_NAME || 'Romenapay';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmail({ platformName, title, preheader, body }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
<tr><td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(platformName)}</td></tr>
<tr><td style="padding:28px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111827;">
<h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${escapeHtml(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;">
Este é um email automático enviado pela ${escapeHtml(platformName)}. Por favor não responda.<br>&copy; ${year} ${escapeHtml(platformName)}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

module.exports = new EmailService();
module.exports.EmailSendError = EmailSendError;