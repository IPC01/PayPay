const { WalletType } = require('../models');

async function seedWalletTypes() {
  const walletTypes = [
    {
      code: 'MPESA',
      name: 'M-Pesa',
      provider: 'Vodacom',
      isExternal: true,
      status: true
    },
    {
      code: 'EMOLA',
      name: 'e-Mola',
      provider: 'Movitel',
      isExternal: true,
      status: true
    }
  ];

  for (const walletType of walletTypes) {
    const exists = await WalletType.findOne({
      where: { code: walletType.code }
    });

    if (!exists) {
      await WalletType.create(walletType);
      console.log(`✅ WalletType ${walletType.code} criado`);
    } else {
      console.log(`⚠️ WalletType ${walletType.code} já existe`);
    }
  }
}

module.exports = seedWalletTypes;