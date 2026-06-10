const jwt = require('jsonwebtoken');
const { tokenBlacklist } = require('../controllers/AuthController');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token revoked (logged out)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    req.token = token;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;