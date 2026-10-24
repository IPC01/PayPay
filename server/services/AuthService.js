const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { User, Role } = require('../models');
const EmailService = require('./EmailService');

const twoFactorChallenges = new Map();
const registrationChallenges = new Map();
const TWO_FACTOR_EXPIRY_MS = 5 * 60 * 1000;
const TWO_FACTOR_MAX_ATTEMPTS = 5;
const SESSION_TTL_SECONDS = 30 * 60;
const MAX_ACTIVE_CODES = 3;
const OTP_SEND_WINDOW_MS = 15 * 60 * 1000;
// Histórico de envios de código por destinatário (anti-rajada: OTPs repetidos em sequência são marcados como spam)
const otpSendLog = new Map();

function otpResendCooldownMs() {
  const value = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS);
  return (Number.isFinite(value) && value >= 0 ? value : 30) * 1000;
}

function otpMaxSendsPerWindow() {
  const value = Number(process.env.OTP_MAX_SENDS_PER_WINDOW);
  return Number.isFinite(value) && value > 0 ? value : 5;
}

class OtpRateLimitError extends Error {
  constructor(retryAfterSeconds) {
    super(`Aguarde ${retryAfterSeconds} segundos antes de pedir um novo codigo.`);
    this.name = 'OtpRateLimitError';
    this.code = 'OTP_RATE_LIMITED';
    this.status = 429;
    this.retryAfter = retryAfterSeconds;
  }
}

// Reserva um envio para o destinatário; lança 429 se ainda estiver em cooldown ou exceder o limite da janela.
function reserveOtpSend(recipient) {
  const key = String(recipient || '').trim().toLowerCase();
  const now = Date.now();
  const sends = (otpSendLog.get(key) || []).filter((ts) => now - ts < OTP_SEND_WINDOW_MS);

  const cooldown = otpResendCooldownMs();
  const last = sends[sends.length - 1];
  if (last !== undefined && now - last < cooldown) {
    throw new OtpRateLimitError(Math.ceil((cooldown - (now - last)) / 1000));
  }
  if (sends.length >= otpMaxSendsPerWindow()) {
    throw new OtpRateLimitError(Math.ceil((OTP_SEND_WINDOW_MS - (now - sends[0])) / 1000));
  }

  sends.push(now);
  otpSendLog.set(key, sends);

  return () => {
    const current = otpSendLog.get(key) || [];
    const idx = current.indexOf(now);
    if (idx >= 0) current.splice(idx, 1);
    if (current.length === 0) otpSendLog.delete(key);
  };
}

function challengeSubject(payload) {
  return payload.userId ? `user:${payload.userId}` : `email:${String(payload.email).toLowerCase()}`;
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

function createResetUrl(token) {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

class AuthService {

  // Token de sessão com duração máxima fixa; depois de expirar o utilizador tem de iniciar sessão novamente.
  createSessionToken(user) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        type: 'session',
        iat: issuedAt
      },
      process.env.JWT_SECRET,
      { expiresIn: SESSION_TTL_SECONDS }
    );

    return {
      token,
      expiresIn: SESSION_TTL_SECONDS,
      expiresAt: new Date((issuedAt + SESSION_TTL_SECONDS) * 1000).toISOString()
    };
  }

  createVerificationChallenge(store, payload, action) {
    const code = String(crypto.randomInt(100000, 1000000));
    const challengeId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + TWO_FACTOR_EXPIRY_MS;
    const subject = challengeSubject(payload);

    const active = [];
    for (const [id, entry] of store) {
      if (entry.expiresAt <= now) store.delete(id);
      else if (entry.subject === subject) active.push(id);
    }
    // Limita o número de códigos ativos por utilizador (reenvios sucessivos)
    while (active.length >= MAX_ACTIVE_CODES) store.delete(active.shift());

    store.set(challengeId, {
      ...payload,
      subject,
      codeHash: hashCode(code),
      expiresAt,
      attempts: 0
    });

    const otpToken = jwt.sign(
      {
        challengeId,
        action,
        ...(payload.userId ? { userId: payload.userId } : {}),
        ...(payload.email ? { email: payload.email } : {})
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return { code, otpToken, challengeId };
  }

  // Envia o código; se o email falhar o desafio é descartado para não ficar um código "fantasma".
  async deliverVerificationCode(store, challengeId, message, release) {
    try {
      await EmailService.sendTwoFactorCode(message);
    } catch (err) {
      store.delete(challengeId);
      // Um envio falhado não conta para o limite de reenvios
      if (release) release();
      throw err;
    }
  }

  // Valida o código contra o desafio do token e aceita também qualquer código ainda ativo
  // do mesmo utilizador (ex.: o email de um pedido anterior chegou depois do reenvio).
  consumeChallenge(store, challengeId, code) {
    const challenge = store.get(challengeId);
    if (!challenge) {
      throw new Error('Codigo de verificacao invalido');
    }

    const now = Date.now();
    if (now > challenge.expiresAt) {
      store.delete(challengeId);
      throw new Error('Codigo expirado. Solicite um novo codigo.');
    }

    if (challenge.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
      store.delete(challengeId);
      throw new Error('Limite de tentativas excedido. Solicite um novo codigo.');
    }

    const codeHash = hashCode(code);
    let matched = false;
    for (const entry of store.values()) {
      if (entry.subject === challenge.subject && entry.expiresAt >= now && entry.codeHash === codeHash) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      challenge.attempts += 1;
      throw new Error('Codigo de verificacao invalido');
    }

    for (const [id, entry] of store) {
      if (entry.subject === challenge.subject) store.delete(id);
    }
  }

  async verifyCredentials(email, password) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      throw new Error('Invalid credentials');
    }

    const release = reserveOtpSend(user.email);
    const { code, otpToken, challengeId } = this.createVerificationChallenge(twoFactorChallenges, {
      userId: user.id,
      email: user.email
    }, 'two_factor_login');

    await this.deliverVerificationCode(twoFactorChallenges, challengeId, {
      to: user.email,
      name: user.name,
      code
    }, release);

    return {
      userId: user.id,
      roleId: user.roleId,
      email: user.email,
      otpToken,
      expiresIn: Math.floor(TWO_FACTOR_EXPIRY_MS / 1000)
    };
  }

  verifyRegistrationCode({ otpToken, code, email }) {
    if (!otpToken || !code) {
      throw new Error('Codigo de verificacao obrigatorio');
    }

    let payload;
    try {
      payload = jwt.verify(otpToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Codigo expirado. Solicite um novo codigo.');
    }

    if (!payload || payload.action !== 'registration_verification' || payload.email !== email) {
      throw new Error('Codigo de verificacao invalido');
    }

    const challenge = registrationChallenges.get(payload.challengeId);
    if (!challenge || challenge.email !== email) {
      throw new Error('Codigo de verificacao invalido');
    }

    this.consumeChallenge(registrationChallenges, payload.challengeId, code);
  }

  async requestRegistrationCode(name, email) {
    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    const exists = await User.findOne({ where: { email } });

    if (exists) {
      throw new Error('User already exists');
    }

    const release = reserveOtpSend(email);
    const { code, otpToken, challengeId } = this.createVerificationChallenge(registrationChallenges, {
      name,
      email
    }, 'registration_verification');

    await this.deliverVerificationCode(registrationChallenges, challengeId, {
      to: email,
      name,
      code,
      purpose: 'registration'
    }, release);

    return {
      message: 'Verification code sent.',
      otpToken,
      expiresIn: Math.floor(TWO_FACTOR_EXPIRY_MS / 1000)
    };
  }

  async register(name, email, password, otpToken, otp) {
    this.verifyRegistrationCode({ otpToken, code: otp, email });

    const exists = await User.findOne({ where: { email } });

    if (exists) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = await Role.findOne({ where: { name: 'user' } });

    const user = await User.create({
      name,
      email,
      passwordHash,
      roleId: userRole ? userRole.id : 2
    });

    const session = this.createSessionToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId
      },
      ...session
    };
  }

  verifyTwoFactorCode({ otpToken, code, userId, email }) {
    if (!otpToken || !code) {
      throw new Error('Codigo de verificacao obrigatorio');
    }

    let payload;
    try {
      payload = jwt.verify(otpToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Codigo expirado. Solicite um novo codigo.');
    }

    if (!payload || payload.action !== 'two_factor_login' || payload.userId !== userId) {
      throw new Error('Codigo de verificacao invalido');
    }

    const challenge = twoFactorChallenges.get(payload.challengeId);
    if (!challenge || challenge.userId !== userId || challenge.email !== email) {
      throw new Error('Codigo de verificacao invalido');
    }

    this.consumeChallenge(twoFactorChallenges, payload.challengeId, code);
  }

  async login(email, password, otpToken, otp) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      throw new Error('Invalid credentials');
    }

    this.verifyTwoFactorCode({
      otpToken,
      code: otp,
      userId: user.id,
      email: user.email
    });

    return {
      ...this.createSessionToken(user),
      userId: user.id
    };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return {
        message: 'If this email is registered, a password reset token was generated.'
      };
    }

    const token = jwt.sign(
      {
        userId: user.id,
        action: 'password_reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await EmailService.sendPasswordReset({
      to: user.email,
      name: user.name,
      token,
      resetUrl: createResetUrl(token)
    });

    return {
      message: 'If this email is registered, a password reset email was sent.'
    };
  }

  async resetPassword(token, newPassword) {
    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Token inválido ou expirado');
    }

    if (!payload || payload.action !== 'password_reset' || !payload.userId) {
      throw new Error('Token inválido');
    }

    const user = await User.findByPk(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    return {
      message: 'Password updated successfully'
    };
  }
}

module.exports = new AuthService();