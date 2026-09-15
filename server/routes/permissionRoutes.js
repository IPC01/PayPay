const router = require('express').Router();
const { Op } = require('sequelize');
const { Permission } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const { getAllowedScopesForUser } = require('../helpers/subscriptionHelper');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      where: { name: { [Op.like]: 'transaction:%' } },
      attributes: ['name', 'description']
    });

    const allowedScopes = await getAllowedScopesForUser(req.user.userId, req.user.roleId);
    const filtered = allowedScopes
      ? permissions.filter((permission) => allowedScopes.includes(permission.name))
      : permissions;

    return res.json({ permissions: filtered });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
