const { User, Role, Permission } = require('../models');

function checkPermission(requiredPermission) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // buscar user com role + permissions
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            include: [
              {
                model: Permission
              }
            ]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const permissions = user.Role?.Permissions || [];

      const hasPermission = permissions.some(
        (perm) => perm.name === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden - missing permission'
        });
      }

      // opcional: anexar user ao request
      req.userData = user;

      next();

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  };
}

module.exports = checkPermission;