const jwt = require('jsonwebtoken');
const { tokenBlacklist } = require('../controllers/AuthController');
const { User, Role } = require('../models');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token revoked (logged out)' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    req.token = token;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Sessão expirada. Inicie sessão novamente.',
        code: 'SESSION_EXPIRED'
      });
    }
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }

  // Só tokens de sessão autenticam; tokens de verificação (OTP), recuperação de senha ou API keys não.
  if (req.user?.type !== 'session') {
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'roleId', 'isActive'],
      include: [{ model: Role, attributes: ['name'] }]
    });
    if (!user || !user.isActive) return res.status(403).json({ error: 'Conta bloqueada ou indisponível' });
    req.user.roleId = user.roleId;
    req.user.roleName = user.Role?.name;

    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = authMiddleware;