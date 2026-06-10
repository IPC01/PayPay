const { Transaction } = require('../models');

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
}

module.exports = new TransactionController();