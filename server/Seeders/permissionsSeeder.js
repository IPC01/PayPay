const { Permission } = require('../models');

async function seedPermissions() {
  const permissions = [
    { name: 'transaction:c2b', description: 'C2B' },
    { name: 'transaction:c2b_test', description: 'C2B Teste' },
    { name: 'transaction:b2c', description: 'B2C' },

    { name: 'admin:all', description: 'Administrador' }
  ];

  for (const p of permissions) {
    const exists = await Permission.findOne({
      where: { name: p.name }
    });

    if (!exists) {
      await Permission.create(p);
      console.log('Permission created:', p.name);
    }
  }
}

module.exports = seedPermissions;