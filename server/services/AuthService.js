const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User, Role } = require('../models');

class AuthService {

  async register(name, email, password) {
    const exists = await User.findOne({ where: { email } });

    if (exists) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = await Role.findOne({ where: { name: 'user' } });

    const user = await User.create({
      name,
      email,
      passwordHash,
      roleId: userRole ? userRole.id : 2
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      token,
      userId: user.id
    };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return {
        message: 'If this email is registered, a password reset token was generated.'
      };
    }

    const token = jwt.sign(
      {
        userId: user.id,
        action: 'password_reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      message: 'Password reset token generated.',
      resetToken: token
    };
  }

  async resetPassword(token, newPassword) {
    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Token inválido ou expirado');
    }

    if (!payload || payload.action !== 'password_reset' || !payload.userId) {
      throw new Error('Token inválido');
    }

    const user = await User.findByPk(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    return {
      message: 'Password updated successfully'
    };
  }
}

module.exports = new AuthService();