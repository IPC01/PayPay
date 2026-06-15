const { User, Role } = require('../models');

async function supportOrAdmin(req, res, next) {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [{ model: Role }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roleName = user.Role?.name;
    if (roleName === 'admin' || roleName === 'support') {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden - support or admin only' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = supportOrAdmin;
