const { Op } = require('sequelize');

module.exports = function walletTransactionWhere(wallet) {
  const associations = [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }];
  if (wallet.walletCode) associations.push({ walletCode: wallet.walletCode });
  return { [Op.or]: associations };
};
