const { Op } = require('sequelize');
const { Transaction, Wallet, WalletType } = require('../models');

class TransactionController {

  async create(req, res) {
    try {
      const { fromWalletId, toWalletId, amount, apiKeyId } = req.body;

      const tx = await Transaction.create({
        fromWalletId,
        toWalletId,
        amount,
        apiKeyId,
        status: 'pending'
      });

      return res.json(tx);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getUserTransactions(req, res) {
    try {
      const userId = req.user.userId;

      const wallets = await Wallet.findAll({
        where: { userId },
        attributes: ['walletCode']
      });

      const walletCodes = wallets.map(wallet => wallet.walletCode);

      if (walletCodes.length === 0) {
        return res.json([]);
      }

      const transactions = await Transaction.findAll({
        where: { walletCode: { [Op.in]: walletCodes } },
        order: [['createdAt', 'DESC']]
      });

      const detailedWallets = await Wallet.findAll({
        where: { walletCode: walletCodes },
        include: [{ model: WalletType, attributes: ['code', 'name', 'provider', 'imageUrl'] }]
      });

      const walletMap = detailedWallets.reduce((acc, wallet) => {
        acc[wallet.walletCode] = {
          walletTypeCode: wallet.WalletType?.code,
          walletTypeName: wallet.WalletType?.name,
          walletTypeProvider: wallet.WalletType?.provider,
          walletTypeImageUrl: wallet.WalletType?.imageUrl
        };
        return acc;
      }, {});

      const enrichedTransactions = transactions.map((tx) => ({
        ...tx.toJSON(),
        ...walletMap[tx.walletCode]
      }));

      return res.json(enrichedTransactions);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TransactionController();