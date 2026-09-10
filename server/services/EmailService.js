const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      throw new Error('SMTP is not configured');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    return this.transporter;
  }

  async sendMail({ to, subject, text, html }) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const transporter = this.getTransporter();

    return transporter.sendMail({ from, to, subject, text, html });
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
          <p>Use o codigo abaixo para concluir o login:</p>
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