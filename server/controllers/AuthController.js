const AuthService = require('../services/AuthService');
const { User } = require('../models');
const { createAuditLog } = require('../helpers/auditLogger');

// simples "logout" via blacklist em memória (MVP)
const tokenBlacklist = new Set();

class AuthController {
  async requestRegistrationCode(req, res) {
    try {
      const { name, email } = req.body;

      const result = await AuthService.requestRegistrationCode(name, email);

      return res.json(result);
    } catch (err) {
      return res.status(400).json({
        error: err.message
      });
    }
  }

  async verifyCredentials(req, res) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.verifyCredentials(email, password);

      return res.json({
        message: 'Credentials valid. Verification code sent.',
        userId: result.userId,
        roleId: result.roleId,
        email: result.email,
        otpToken: result.otpToken,
        expiresIn: result.expiresIn
      });
    } catch (err) {
      return res.status(401).json({
        error: err.message
      });
    }
  }

  async register(req, res) {
    try {
      const { name, email, password, otpToken, otp } = req.body;

      const result = await AuthService.register(name, email, password, otpToken, otp);

      return res.status(201).json({
        message: 'User created successfully',
        user: result.user,
        token: result.token
      });

    } catch (err) {
      return res.status(400).json({
        error: err.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password, otpToken, otp } = req.body;

      const result = await AuthService.login(email, password, otpToken, otp);

      await createAuditLog({
        userId: result.userId || null,
        action: 'login',
        entity: 'User',
        entityId: String(result.userId || ''),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'Login successful',
        token: result.token
      });

    } catch (err) {
      return res.status(401).json({
        error: err.message
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }

      const result = await AuthService.resetPassword(token, password);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json({ error: 'Token missing' });
      }

      await createAuditLog({
        userId: req.user?.userId || null,
        action: 'logout',
        entity: 'User',
        entityId: String(req.user?.userId || ''),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      tokenBlacklist.add(token);

      return res.json({
        message: 'Logout successful'
      });

    } catch (err) {
      return res.status(500).json({
        error: err.message
      });
    }
  }

  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.userId, {
        attributes: ['id', 'name', 'email', 'createdAt', 'profilePhotoUrl', 'roleId']
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  isBlacklisted(token) {
    return tokenBlacklist.has(token);
  }
}

module.exports = new AuthController();
module.exports.tokenBlacklist = tokenBlacklist;