const seedRoles = require('./rolesSeeder');
const seedPermissions = require('./permissionsSeeder');
const seedRolePermissions = require('./rolePermissionsSeeder');
const seedUsers = require('./usersSeeder');
const seedWalletTypes = require('./walletTypesSeeder');

async function runSeeds() {
  try {
    console.log('🌱 Running seeds...');

    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedUsers();
    await seedWalletTypes();

    console.log('✅ Seeds completed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

runSeeds();