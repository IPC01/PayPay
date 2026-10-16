const { Op } = require('sequelize');
const { Transaction, Wallet, WalletType } = require('../models');
const TransactionReversalService = require('../services/TransactionReversalService');

class TransactionController {

  async create(req, res) {
    try {
      const { fromWalletId, toWalletId, amount, apiKeyId } = req.body;

      const tx = await Transaction.create({
        fromWalletId,
        toWalletId,
        amount,
        type: req.body.type || 'payment',
        paymentMode: req.body.paymentMode || null,
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
      const { walletId } = req.query;

      let walletCodes;

      if (walletId) {
        const wallet = await Wallet.findOne({ where: { id: walletId, userId } });
        if (!wallet) {
          return res.json([]);
        }
        walletCodes = [wallet.walletCode];
      } else {
        const wallets = await Wallet.findAll({
          where: { userId },
          attributes: ['walletCode']
        });

        walletCodes = wallets.map((wallet) => wallet.walletCode);
      }

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

  // Owner reversal (/api/transactions/:id/reverse) or admin reversal (/api/admin/transactions/:id/reverse).
  async reverse(req, res) {
    try {
      const result = await TransactionReversalService.execute({
        transactionId: req.params.id,
        userId: req.user.userId,
        isAdmin: Boolean(req.isAdminReversal),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(result.success ? 200 : result.pending ? 202 : 400).json(result);
    } catch (error) {
      return res.status(error.statusCode || 500).json({ success: false, error: error.message, message: error.message });
    }
  }
}

module.exports = new TransactionController();