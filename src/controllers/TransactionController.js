const { Op } = require('sequelize');
const { Transaction, Wallet } = require('../models');

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

      return res.json(transactions);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TransactionController();