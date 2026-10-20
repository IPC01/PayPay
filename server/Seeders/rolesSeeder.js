const { Role } = require('../models');

async function seedRoles() {
  const legacy = await Role.findOne({ where: { name: 'support' } });
  const operator = await Role.findOne({ where: { name: 'operator' } });
  if (legacy && !operator) await legacy.update({ name: 'operator' });
  const roles = ['admin', 'user', 'operator'];

  for (const name of roles) {
    const exists = await Role.findOne({ where: { name } });

    if (!exists) {
      await Role.create({ name });
      console.log(`Role created: ${name}`);
    }
  }
}

module.exports = seedRoles;