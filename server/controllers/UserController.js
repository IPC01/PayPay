const bcrypt = require('bcryptjs');
const { User, Role, Permission } = require('../models');
const { saveBase64Image } = require('../helpers/imageStorage');

const CREATABLE_ROLE_NAMES = ['admin', 'user'];

class UserController {

  // CRIAR USER (apenas perfis admin ou user)
  async create(req, res) {
    try {
      const { name, email, password, roleName } = req.body;

      if (!name || !email || !password || !roleName) {
        return res.status(400).json({
          error: 'Nome, email, password e perfil são obrigatórios'
        });
      }

      if (!CREATABLE_ROLE_NAMES.includes(roleName)) {
        return res.status(400).json({
          error: 'Perfil inválido. Utilize "admin" ou "user"'
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Já existe um utilizador com este email'
        });
      }

      const role = await Role.findOne({ where: { name: roleName } });
      if (!role) {
        return res.status(400).json({
          error: 'Perfil não encontrado'
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        passwordHash,
        roleId: role.id,
        isActive: true
      });

      return res.status(201).json({
        message: 'Utilizador criado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          isActive: user.isActive
        }
      });

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // LISTAR TODOS USERS COM ROLE + PERMISSIONS
  async getAll(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'createdAt', 'isActive'],
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
        attributes: ['id', 'name', 'email', 'isActive'],
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
      const { name, email, roleId, profilePhotoBase64, isActive } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      if (
        typeof isActive !== 'undefined' &&
        !isActive &&
        req.user?.userId === user.id
      ) {
        return res.status(400).json({
          error: 'Não é possível bloquear a sua própria conta'
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
        isActive: typeof isActive !== 'undefined' ? isActive : user.isActive,
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