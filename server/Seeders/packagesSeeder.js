const { Package } = require('../models');

async function seedPackages() {
  const legacyCodes = ['teste', 'basico', 'pro'];
  await Package.update({ active: false }, { where: { code: legacyCodes } });

  const packages = [
    {
      code: 'desenvolvedor',
      name: 'Desenvolvedor',
      price: 0.0,
      description: 'Pacote gratuito para desenvolvimento e testes. Dá acesso apenas às APIs de teste (mock), sem transações reais.',
      permissionsGranted: 'transaction:c2b_test',
      permissionsDenied: 'transaction:c2b,transaction:b2c',
      isFree: true,
      active: true
    },
    {
      code: 'empresa',
      name: 'Empresa',
      price: 499.9,
      description: 'Pacote para produção com acesso a transações reais de C2B e B2C.',
      permissionsGranted: 'transaction:c2b,transaction:b2c',
      permissionsDenied: '',
      isFree: false,
      active: true
    }
  ];

  for (const pkg of packages) {
    const existing = await Package.findOne({ where: { code: pkg.code } });
    if (!existing) {
      await Package.create(pkg);
      console.log(`Package created: ${pkg.code}`);
    }
  }
}

module.exports = seedPackages;
