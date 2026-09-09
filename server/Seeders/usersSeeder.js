const bcrypt = require('bcrypt');
const { User, Role } = require('../models');

async function seedUsers() {
  const adminRole = await Role.findOne({ where: { name: 'admin' } });
  const userRole = await Role.findOne({ where: { name: 'user' } });

  const users = [
    {
      name: 'Admin System',
      email: 'admin@gmail.com',
      password: '123456',
      roleId: adminRole.id
    },
    {
      name: 'Stelio Mondlane',
      email: 'stelio@gmail.com',
      password: '123456',
      roleId: userRole.id
    }
  ];

  for (const u of users) {
    const exists = await User.findOne({
      where: { email: u.email }
    });

    if (!exists) {
      const passwordHash = await bcrypt.hash(u.password, 10);

      await User.create({
        name: u.name,
        email: u.email,
        passwordHash,
        roleId: u.roleId
      });

      console.log(`User created: ${u.email}`);
    }
  }
}

module.exports = seedUsers;