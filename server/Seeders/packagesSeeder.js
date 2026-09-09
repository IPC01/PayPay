const { Package } = require('../models');

async function seedPackages() {
  const packages = [
    {
      code: 'teste',
      name: 'Teste',
      price: 0.0,
      description: 'Pacote de teste gratuito com acesso básico para avaliação do sistema.',
      permissionsGranted: 'carteira developer, teste c2b, teste b2c',
      permissionsDenied: 'acesso_premium,relatorios_avancados',
      active: true
    },
    {
      code: 'basico',
      name: 'Básico',
      price: 99.9,
      description: 'Pacote básico com recursos essenciais para produção.',
      permissionsGranted: 'carteiras de produção, c2b',
      permissionsDenied: 'c2c,relatorios_avancados,suporte_prioritario',
      active: true
    },
    {
      code: 'pro',
      name: 'Pro',
      price: 249.9,
      description: 'Pacote Pro com funcionalidades avançadas e todas as permissões básicas e B2C.',
      permissionsGranted: 'carteiras de produção, c2b, b2c, suporte_prioritario',
      permissionsDenied: '',
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
