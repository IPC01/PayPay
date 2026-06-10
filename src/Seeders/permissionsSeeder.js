const { Permission } = require('../models');

async function seedPermissions() {
  const permissions = [
    { name: 'wallet:create' },
    { name: 'wallet:view' },
    { name: 'wallet:deposit' },
    { name: 'wallet:withdraw' },
    { name: 'wallet:transfer' },

    { name: 'user:create' },
    { name: 'user:view' },
    { name: 'user:delete' },

    { name: 'admin:all' }
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