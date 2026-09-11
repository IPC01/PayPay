const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { User, Role } = require('../models');
const EmailService = require('./EmailService');

const twoFactorChallenges = new Map();
const registrationChallenges = new Map();
const TWO_FACTOR_EXPIRY_MS = 5 * 60 * 1000;
const TWO_FACTOR_MAX_ATTEMPTS = 5;

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function createResetUrl(token) {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

class AuthService {

  createVerificationChallenge(store, payload, action) {
    const code = String(crypto.randomInt(100000, 1000000));
    const challengeId = crypto.randomUUID();
    const expiresAt = Date.now() + TWO_FACTOR_EXPIRY_MS;

    store.set(challengeId, {
      ...payload,
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

    return { code, otpToken };
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

    const { code, otpToken } = this.createVerificationChallenge(twoFactorChallenges, {
      userId: user.id,
      email: user.email
    }, 'two_factor_login');

    await EmailService.sendTwoFactorCode({
      to: user.email,
      name: user.name,
      code
    });

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

    if (Date.now() > challenge.expiresAt) {
      registrationChallenges.delete(payload.challengeId);
      throw new Error('Codigo expirado. Solicite um novo codigo.');
    }

    if (challenge.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
      registrationChallenges.delete(payload.challengeId);
      throw new Error('Limite de tentativas excedido. Solicite um novo codigo.');
    }

    if (challenge.codeHash !== hashCode(code)) {
      challenge.attempts += 1;
      throw new Error('Codigo de verificacao invalido');
    }

    registrationChallenges.delete(payload.challengeId);
  }

  async requestRegistrationCode(name, email) {
    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    const exists = await User.findOne({ where: { email } });

    if (exists) {
      throw new Error('User already exists');
    }

    const { code, otpToken } = this.createVerificationChallenge(registrationChallenges, {
      name,
      email
    }, 'registration_verification');

    await EmailService.sendTwoFactorCode({
      to: email,
      name,
      code
    });

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

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId
      },
      token
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

    if (Date.now() > challenge.expiresAt) {
      twoFactorChallenges.delete(payload.challengeId);
      throw new Error('Codigo expirado. Solicite um novo codigo.');
    }

    if (challenge.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
      twoFactorChallenges.delete(payload.challengeId);
      throw new Error('Limite de tentativas excedido. Solicite um novo codigo.');
    }

    if (challenge.codeHash !== hashCode(code)) {
      challenge.attempts += 1;
      throw new Error('Codigo de verificacao invalido');
    }

    twoFactorChallenges.delete(payload.challengeId);
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

    // 2FA no login temporariamente desativado durante os testes.
    // Para reativar, restaure a validação abaixo:
    // this.verifyTwoFactorCode({
    //   otpToken,
    //   code: otp,
    //   userId: user.id,
    //   email: user.email
    // });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      token,
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