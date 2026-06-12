const { User, Role, Permission } = require('../models');
const { saveBase64Image } = require('../helpers/imageStorage');

class UserController {

  // LISTAR TODOS USERS COM ROLE + PERMISSIONS
  async getAll(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'createdAt'],
        include: [
          {
            model: Role,
            attributes: ['id', 'name'],
            include: [
              {
                model: Permission,
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });

      return res.json(users);

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // GET USER BY ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email'],
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
        return res.status(404).json({
          error: 'User not found'
        });
      }

      return res.json(user);

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // UPDATE USER
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, roleId, profilePhotoBase64 } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      if (profilePhotoBase64) {
        try {
          const imageUrl = await saveBase64Image(profilePhotoBase64, 'users', `user-${user.id}`);
          user.profilePhotoUrl = imageUrl;
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }
      }

      await user.update({
        name: name || user.name,
        email: email || user.email,
        roleId: roleId || user.roleId,
        profilePhotoUrl: user.profilePhotoUrl
      });

      return res.json({
        message: 'User updated successfully',
        user
      });

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // DELETE USER
  async delete(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      await user.destroy();

      return res.json({
        message: 'User deleted successfully'
      });

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new UserController();