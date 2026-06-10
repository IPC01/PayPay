const { Role, Permission, RolePermission } = require('../models');

async function seedRolePermissions() {
  const roles = await Role.findAll();
  const permissions = await Permission.findAll();

  const getRole = (name) =>
    roles.find(r => r.name === name);

  const getPerm = (name) =>
    permissions.find(p => p.name === name);

  const mapping = {
    user: [
      'wallet:create',
      'wallet:view',
      'wallet:deposit',
      'wallet:transfer'
    ],

    support: [
      'wallet:view',
      'user:view'
    ],

    admin: [
      'admin:all'
    ]
  };

  for (const [roleName, perms] of Object.entries(mapping)) {
    const role = getRole(roleName);
    if (!role) continue;

    for (const permName of perms) {
      const perm = getPerm(permName);
      if (!perm) continue;

      const exists = await RolePermission.findOne({
        where: {
          roleId: role.id,
          permissionId: perm.id
        }
      });

      if (!exists) {
        await RolePermission.create({
          roleId: role.id,
          permissionId: perm.id
        });

        console.log(`${roleName} -> ${permName}`);
      }
    }
  }
}

module.exports = seedRolePermissions;