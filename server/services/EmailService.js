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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------------------------------------------------------------------------
 * Layout base do email (tabelas + estilos inline para máxima compatibilidade
 * com Gmail, Outlook, Apple Mail, Yahoo, etc.)
 * ------------------------------------------------------------------------- */
function renderLayout({ platformName, preheader, title, bodyHtml, footerNote }) {
  const year = new Date().getFullYear();
  const primary = '#0f766e';       // teal
  const primaryDark = '#115e59';
  const bg = '#f4f6f8';
  const card = '#ffffff';
  const text = '#1f2937';
  const muted = '#6b7280';
  const border = '#e5e7eb';

  return `<!DOCTYPE html>
<html lang="pt" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Pré-header (texto que aparece na pré-visualização) -->
  <div style="display:none;font-size:1px;color:${bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(preheader || '')}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${bg};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:8px 0 16px 0;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:${primary};letter-spacing:.3px;">
                ${escapeHtml(platformName)}
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${card};border:1px solid ${border};border-radius:12px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;background:${primary};line-height:4px;font-size:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;color:${text};font-size:15px;line-height:1.6;">
                    <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.3;color:${text};font-weight:700;">
                      ${escapeHtml(title)}
                    </h1>
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 28px 28px 28px;">
                    <hr style="border:none;border-top:1px solid ${border};margin:8px 0 16px 0;" />
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${muted};">
                      ${footerNote
                        ? escapeHtml(footerNote)
                        : `Se precisar de ajuda, responda a este email. &copy; ${year} ${escapeHtml(platformName)}. Todos os direitos reservados.`}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rodapé externo -->
          <tr>
            <td align="center" style="padding:16px 8px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:${muted};">
              Este email foi enviado automaticamente. Por favor, n&atilde;o responda diretamente a esta mensagem.
              <br />
              <span style="color:${primaryDark};font-weight:600;">${escapeHtml(platformName)}</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* Bloco grande do código OTP */
function renderCodeBox(code) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px 0;">
      <tr>
        <td align="center" style="background:#f0fdfa;border:1px dashed #0f766e;border-radius:10px;padding:22px 12px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;color:#0f766e;text-transform:uppercase;font-weight:700;margin-bottom:8px;">
            C&oacute;digo de verifica&ccedil;&atilde;o
          </div>
          <div style="font-family:'Courier New',Courier,monospace;font-size:34px;letter-spacing:10px;font-weight:700;color:#0f172a;line-height:1.2;">
            ${escapeHtml(code)}
          </div>
        </td>
      </tr>
    </table>`;
}

/* Botão "bulletproof" (funciona em Outlook) */
function renderButton(href, label) {
  const safeHref = escapeHtml(href);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td align="center" bgcolor="#0f766e" style="border-radius:8px;">
          <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/* Link de fallback (quando o botão não abre) */
function renderFallbackLink(href) {
  const safeHref = escapeHtml(href);
  return `
    <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">
      Se o bot&atilde;o n&atilde;o funcionar, copie e cole este link no navegador:<br />
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
         style="color:#0f766e;word-break:break-all;text-decoration:underline;">
        ${safeHref}
      </a>
    </p>`;
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
      const err = new EmailSendError('Corpo do email vazio — envio bloqueado.');
      console.error('[EMAIL ERROR]', err.message, { to, subject });
      throw err;
    }

    // HTML é opcional; se vier, tem de ser string válida
    const safeHtml = typeof html === 'string' && html.trim() ? html : undefined;

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
            'X-Entity-Ref-ID': safeUuid()
          }
        };
        if (safeHtml) mailOptions.html = safeHtml;
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
    const displayName = name ? escapeHtml(name) : '';
    const greeting = displayName ? `Ol&aacute;, ${displayName},` : 'Ol&aacute;,';
    const greetingText = name ? `Olá ${name},` : 'Olá,';

    const subject = isRegistration
      ? `Confirme o seu email - ${platformName}`
      : `Código de acesso - ${platformName}`;

    const title = isRegistration ? 'Confirme o seu email' : 'Código de acesso';

    const introText = isRegistration
      ? `Use o código abaixo para confirmar o seu email e concluir a criação da conta na ${platformName}.`
      : `Use o código abaixo para concluir o início de sessão na sua conta ${platformName}.`;

    const introHtml = isRegistration
      ? `Use o c&oacute;digo abaixo para <strong>confirmar o seu email</strong> e concluir a cria&ccedil;&atilde;o da conta na <strong>${escapeHtml(platformName)}</strong>.`
      : `Use o c&oacute;digo abaixo para <strong>concluir o in&iacute;cio de sess&atilde;o</strong> na sua conta <strong>${escapeHtml(platformName)}</strong>.`;

    const bodyHtml = `
      <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;">
        ${greeting}
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;">
        ${introHtml}
      </p>
      ${renderCodeBox(safeCode)}
      <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;">
        Este c&oacute;digo expira em <strong>5 minutos</strong> e s&oacute; pode ser usado uma vez.
      </p>
      <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;">
        Se n&atilde;o foi voc&ecirc; que fez este pedido, ignore este email e n&atilde;o partilhe o c&oacute;digo com ningu&eacute;m.
      </p>`;

    const html = renderLayout({
      platformName,
      preheader: isRegistration
        ? `O seu código de confirmação para ${platformName}`
        : `O seu código de acesso para ${platformName}`,
      title,
      bodyHtml,
      footerNote: `Equipa ${platformName} — se não reconhece este pedido, contacte o suporte.`
    });

    return this.sendMail({
      to,
      subject,
      text: [
        greetingText,
        '',
        introText,
        '',
        `Código de verificação: ${safeCode}`,
        '',
        'Este código expira em 5 minutos e só pode ser usado uma vez.',
        'Se não foi você que fez este pedido, ignore este email e não partilhe o código com ninguém.',
        '',
        `Equipa ${platformName}`
      ].join('\n'),
      html,
    });
  }

  async sendPasswordReset({ to, name, resetUrl }) {
    if (!resetUrl || typeof resetUrl !== 'string' || !resetUrl.trim()) {
      throw new EmailSendError(
        'URL de redefinição ausente — email de reset não enviado.'
      );
    }

    const platformName = getPlatformName();
    const displayName = name ? escapeHtml(name) : '';
    const greeting = displayName ? `Ol&aacute;, ${displayName},` : 'Ol&aacute;,';
    const greetingText = name ? `Olá ${name},` : 'Olá,';

    const subject = `Redefinição da sua senha - ${platformName}`;
    const title = 'Redefinir a sua senha';

    const bodyHtml = `
      <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;">
        ${greeting}
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;">
        Recebemos um pedido para <strong>redefinir a senha</strong> da sua conta
        <strong>${escapeHtml(platformName)}</strong>. Clique no bot&atilde;o abaixo
        para escolher uma nova senha.
      </p>
      ${renderButton(resetUrl, 'Redefinir a minha senha')}
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;">
        Este link &eacute; v&aacute;lido durante <strong>1 hora</strong> e s&oacute;
        pode ser usado uma vez.
      </p>
      <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;">
        Se n&atilde;o foi voc&ecirc; que fez este pedido, ignore este email. A sua
        senha n&atilde;o ser&aacute; alterada.
      </p>
      ${renderFallbackLink(resetUrl)}`;

    const html = renderLayout({
      platformName,
      preheader: `Pedido de redefinição de senha para a sua conta ${platformName}`,
      title,
      bodyHtml,
      footerNote: `Equipa ${platformName} — nunca lhe pediremos a sua senha por email.`
    });

    return this.sendMail({
      to,
      subject,
      text: [
        greetingText,
        '',
        `Recebemos um pedido para redefinir a senha da sua conta ${platformName}.`,
        'Abra o link abaixo para escolher uma nova senha (válido durante 1 hora):',
        resetUrl,
        '',
        'Se não foi você que fez este pedido, ignore este email. A sua senha não será alterada.',
        '',
        `Equipa ${platformName}`
      ].join('\n'),
      html,
    });
  }
}

function getPlatformName() {
  return process.env.PLATFORM_NAME || 'Romenapay';
}

module.exports = new EmailService();
module.exports.EmailSendError = EmailSendError;
module.exports.renderLayout = renderLayout;
module.exports.escapeHtml = escapeHtml;