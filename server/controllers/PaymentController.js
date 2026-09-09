const {
  Wallet,
  WalletType,
  Transaction,
  Ledger,
  TransactionFee
} = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('../services/PaymentService');
const { createAuditLog } = require('../helpers/auditLogger');

class PaymentController {
  async getFeeAmount(walletTypeId, transactionType, amount) {
    const feeRecord = await TransactionFee.findOne({
      where: {
        walletTypeId,
        type: transactionType
      }
    });

    const feePercent = feeRecord ? parseFloat(feeRecord.feePercent) : 0;
    const amountValue = Number(amount) || 0;
    const feeAmount = (amountValue * feePercent) / 100;
    return Number.isFinite(feeAmount) ? Math.max(0, feeAmount) : 0;
  }
  async c2b(req, res) {
    let transaction = null;
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

      if (wallet.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Wallet is not active' });
      }

      if (wallet.allowC2B === false) {
        return res.status(403).json({ error: 'Wallet is not authorized for C2B transactions' });
      }

      const walletType = await WalletType.findByPk(wallet.walletTypeId);

      if (!walletType) {
        return res.status(404).json({ error: 'Wallet type not found' });
      }

      if (!walletType.code) {
        return res.status(500).json({ error: 'Wallet type code is not configured' });
      }

      const provider = String(walletType.code).toLowerCase();

      const existingTransaction = await Transaction.findOne({
        where: { reference }
      });

      if (existingTransaction) {
        return res.status(400).json({
          error: 'Reference already used for another transaction'
        });
      }

      const feeAmount = await this.getFeeAmount(wallet.walletTypeId, 'c2b', amount);
      transaction = await Transaction.create({
        fromWalletId: wallet.id,
        toWalletId: null,
        amount,
        fee: feeAmount,
        type: 'c2b',
        paymentMode: 'C2B',
        phone,
        walletCode,
        reference,
        status: 'pending',
        apiKeyId: req.apiKey?.id || null,
        provider
      });

      let providerResponse;
      let success = false;

      try {
        providerResponse = await PaymentService.createC2B({
          provider,
          phone,
          amount,
          reference,
          mode: req.mpesaMode
        });
      } catch (err) {
        await transaction.update({
          status: 'failed',
          providerResponse: JSON.stringify({
            error: err.message
          }),
          systemErrorCode: 'SYS-1001',
          systemErrorMessage: err.message
        });

        await createAuditLog({
          userId: wallet.userId || null,
          action: 'transaction_c2b_failed',
          entity: 'Transaction',
          entityId: transaction.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      success = providerResponse?.output_ResponseCode === 'INS-0';
      const providerResponseMessage =
        providerResponse?.output_ResponseDescription ||
        providerResponse?.output_ResponseDesc ||
        null;

      await transaction.update({
        status: success ? 'success' : 'failed',
        providerReference: providerResponse?.output_ConversationID,
        providerTransactionId: providerResponse?.output_TransactionID,
        providerResponse: JSON.stringify(providerResponse),
        providerResponseCode: providerResponse?.output_ResponseCode,
        providerResponseMessage
      });

      if (success) {
        const previousBalance = parseFloat(wallet.balance || 0);
        const amountValue = parseFloat(amount) || 0;
        const netAmount = Math.max(0, amountValue - feeAmount);
        const newBalance = previousBalance + netAmount;
        wallet.balance = newBalance;

        await sequelize.transaction(async (t) => {
          await wallet.save({ transaction: t });
          await Ledger.create({
            transactionId: transaction.id,
            walletId: wallet.id,
            type: 'credit',
            amount: netAmount,
            balanceBefore: previousBalance,
            balanceAfter: newBalance
          }, { transaction: t });
        });

        await createAuditLog({
          userId: wallet.userId || null,
          action: 'transaction_c2b_success',
          entity: 'Transaction',
          entityId: transaction.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      return res.status(success ? 200 : 400).json({
        success,
        provider,
        transactionId: transaction.id,
        response: providerResponse
      });

    } catch (error) {
      console.error('PaymentController.c2b error', error);
      if (transaction) {
        await transaction.update({
          status: 'failed',
          systemErrorCode: 'SYS-1001',
          systemErrorMessage: error.message
        });
      }

      return res.status(500).json({
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development'
          ? error.stack
          : undefined
      });
    }
  }

  async b2c(req, res) {
    let transaction = null;
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

      if (wallet.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Wallet is not active' });
      }

      if (wallet.allowB2C === false) {
        return res.status(403).json({ error: 'Wallet is not authorized for B2C transactions' });
      }

      const walletType = await WalletType.findByPk(wallet.walletTypeId);

      if (!walletType) {
        return res.status(404).json({ error: 'Wallet type not found' });
      }

      if (!walletType.code) {
        return res.status(500).json({ error: 'Wallet type code is not configured' });
      }

      const provider = String(walletType.code).toLowerCase();

      const existingTransaction = await Transaction.findOne({
        where: { reference }
      });

      if (existingTransaction) {
        return res.status(400).json({
          error: 'Reference already used for another transaction'
        });
      }

      const amountValue = parseFloat(amount) || 0;
      const feeAmount = await this.getFeeAmount(wallet.walletTypeId, 'b2c', amountValue);
      transaction = await Transaction.create({
        fromWalletId: wallet.id,
        toWalletId: null,
        amount,
        fee: feeAmount,
        type: 'b2c',
        paymentMode: 'B2C',
        phone,
        walletCode,
        reference,
        status: 'pending',
        apiKeyId: req.apiKey?.id || null,
        provider
      });
      const totalDebit = amountValue + feeAmount;

      if (parseFloat(wallet.balance || 0) < totalDebit) {
        await transaction.update({
          status: 'failed',
          systemErrorCode: 'SYS-2001',
          systemErrorMessage: 'Insufficient wallet balance'
        });
        await createAuditLog({
          userId: wallet.userId || null,
          action: 'transaction_b2c_failed_insufficient_funds',
          entity: 'Transaction',
          entityId: transaction.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.status(400).json({
          success: false,
          error: 'Insufficient wallet balance'
        });
      }

      let providerResponse;
      let success = false;

      try {
        providerResponse = await PaymentService.createB2C({
          provider,
          phone,
          amount,
          reference,
          mode: req.mpesaMode
        });
      } catch (err) {
        await transaction.update({
          status: 'failed',
          providerResponse: JSON.stringify({
            error: err.message
          }),
          systemErrorCode: 'SYS-1001',
          systemErrorMessage: err.message
        });

        await createAuditLog({
          userId: wallet.userId || null,
          action: 'transaction_b2c_failed',
          entity: 'Transaction',
          entityId: transaction.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      success = providerResponse?.output_ResponseCode === 'INS-0';
      const providerResponseMessage =
        providerResponse?.output_ResponseDescription ||
        providerResponse?.output_ResponseDesc ||
        null;

      await transaction.update({
        status: success ? 'success' : 'failed',
        providerReference: providerResponse?.output_ConversationID,
        providerTransactionId: providerResponse?.output_TransactionID,
        providerResponse: JSON.stringify(providerResponse),
        providerResponseCode: providerResponse?.output_ResponseCode,
        providerResponseMessage
      });

      if (success) {
        const previousBalance = parseFloat(wallet.balance || 0);
        const totalDebit = amountValue + feeAmount;
        const newBalance = previousBalance - totalDebit;
        wallet.balance = newBalance;

        await sequelize.transaction(async (t) => {
          await wallet.save({ transaction: t });
          await Ledger.create({
            transactionId: transaction.id,
            walletId: wallet.id,
            type: 'debit',
            amount: totalDebit,
            balanceBefore: previousBalance,
            balanceAfter: newBalance
          }, { transaction: t });
        });

        await createAuditLog({
          userId: wallet.userId || null,
          action: 'transaction_b2c_success',
          entity: 'Transaction',
          entityId: transaction.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      return res.status(success ? 200 : 400).json({
        success,
        provider,
        transactionId: transaction.id,
        response: providerResponse
      });

    } catch (error) {
      console.error('PaymentController.b2c error', error);
      if (transaction) {
        await transaction.update({
          status: 'failed',
          systemErrorCode: 'SYS-1001',
          systemErrorMessage: error.message
        });
      }

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