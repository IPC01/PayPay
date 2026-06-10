const {
  Wallet,
  WalletType,
  Transaction
} = require('../models');

const PaymentService = require('../services/PaymentService');

class PaymentController {
  async c2b(req, res) {
    try {
      const {
        walletCode,
        amount,
        phone,
        reference
      } = req.body;

      if (!walletCode || !amount || !phone || !reference) {
        return res.status(400).json({
          error: 'walletCode, amount, phone and reference are required'
        });
      }

      const wallet = await Wallet.findOne({
        where: { walletCode }
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const walletType = await WalletType.findByPk(wallet.walletTypeId);

      if (!walletType) {
        return res.status(404).json({ error: 'Wallet type not found' });
      }

      const provider = walletType.code.toLowerCase();

      const transaction = await Transaction.create({
        fromWalletId: wallet.id,
        toWalletId: null,
        amount,
        phone,
        walletCode,
        reference,
        status: 'pending',
        apiKeyId: req.apiKey.id,
        provider
      });

      let providerResponse;

      try {
        providerResponse = await PaymentService.createC2B({
          provider,
          phone,
          amount,
          reference
        });
      } catch (err) {
        await transaction.update({
          status: 'failed',
          providerResponse: JSON.stringify({
            error: err.message
          })
        });

        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      const success =
        providerResponse?.output_ResponseCode === 'INS-0';

      await transaction.update({
        status: success ? 'success' : 'failed',
        providerReference: providerResponse?.output_ConversationID,
        providerTransactionId: providerResponse?.output_TransactionID,
        providerResponse: JSON.stringify(providerResponse)
      });

      return res.status(success ? 200 : 400).json({
        success,
        provider,
        transactionId: transaction.id,
        response: providerResponse
      });

    } catch (error) {
      return res.status(500).json({
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development'
          ? error.stack
          : undefined
      });
    }
  }
}

module.exports = new PaymentController();