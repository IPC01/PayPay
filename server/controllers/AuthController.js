const AuthService = require('../services/AuthService');
const { User } = require('../models');
const { createAuditLog } = require('../helpers/auditLogger');

// simples "logout" via blacklist em memória (MVP)
const tokenBlacklist = new Set();

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const user = await AuthService.register(name, email, password);

      return res.status(201).json({
        message: 'User created successfully',
        user
      });

    } catch (err) {
      return res.status(400).json({
        error: err.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

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