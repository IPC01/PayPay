const { Role } = require('../models');

async function seedRoles() {
  const roles = ['admin', 'user', 'support'];

  for (const name of roles) {
    const exists = await Role.findOne({ where: { name } });

    if (!exists) {
      await Role.create({ name });
      console.log(`Role created: ${name}`);
    }
  }
}

module.exports = seedRoles;