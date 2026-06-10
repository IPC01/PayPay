const AuthService = require('../services/AuthService');

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

  isBlacklisted(token) {
    return tokenBlacklist.has(token);
  }
}

module.exports = new AuthController();
module.exports.tokenBlacklist = tokenBlacklist;