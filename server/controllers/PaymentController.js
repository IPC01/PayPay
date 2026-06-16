const {
  Wallet,
  WalletType,
  Transaction,
  Ledger
} = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('../services/PaymentService');
const { createAuditLog } = require('../helpers/auditLogger');

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

      const provider = walletType.code.toLowerCase();

      const existingTransaction = await Transaction.findOne({
        where: { reference }
      });

      if (existingTransaction) {
        return res.status(400).json({
          error: 'Reference already used for another transaction'
        });
      }

      let transaction = null;
      transaction = await Transaction.create({
        fromWalletId: wallet.id,
        toWalletId: null,
        amount,
        type: 'c2b',
        paymentMode: 'C2B',
        phone,
        walletCode,
        reference,
        status: 'pending',
        apiKeyId: req.apiKey.id,
        provider
      });

      let providerResponse;
      let success = false;

      // Simulação local: não chamar o gateway M-Pesa, forçar sucesso.
      // try {
      //   providerResponse = await PaymentService.createC2B({
      //     provider,
      //     phone,
      //     amount,
      //     reference,
      //     mode: req.mpesaMode
      //   });
      // } catch (err) {
      //   await transaction.update({
      //     status: 'failed',
      //     providerResponse: JSON.stringify({
      //       error: err.message
      //     }),
      //     systemErrorCode: 'SYS-1001',
      //     systemErrorMessage: err.message
      //   });
      //
      //   await createAuditLog({
      //     userId: wallet.userId || null,
      //     action: 'transaction_c2b_failed',
      //     entity: 'Transaction',
      //     entityId: transaction.id,
      //     ip: req.ip,
      //     userAgent: req.headers['user-agent']
      //   });
      //
      //   return res.status(400).json({
      //     success: false,
      //     error: err.message
      //   });
      // }

      providerResponse = {
        output_ResponseCode: 'INS-0',
        output_ResponseDescription: 'Request processed successfully',
        output_ConversationID: `SIM-${transaction.id}`,
        output_TransactionID: `SIMTX-${transaction.id}`
      };
      success = true;

      await transaction.update({
        status: success ? 'success' : 'failed',
        providerReference: providerResponse?.output_ConversationID,
        providerTransactionId: providerResponse?.output_TransactionID,
        providerResponse: JSON.stringify(providerResponse),
        providerResponseCode: providerResponse?.output_ResponseCode,
        providerResponseMessage: providerResponse?.output_ResponseDescription
      });

      if (success) {
        const previousBalance = parseFloat(wallet.balance || 0);
        const newBalance = previousBalance + parseFloat(amount);
        wallet.balance = newBalance;

        await sequelize.transaction(async (t) => {
          await wallet.save({ transaction: t });
          await Ledger.create({
            transactionId: transaction.id,
            walletId: wallet.id,
            type: 'credit',
            amount,
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

      const provider = walletType.code.toLowerCase();

      const existingTransaction = await Transaction.findOne({
        where: { reference }
      });

      if (existingTransaction) {
        return res.status(400).json({
          error: 'Reference already used for another transaction'
        });
      }

      let transaction = null;
      transaction = await Transaction.create({
        fromWalletId: wallet.id,
        toWalletId: null,
        amount,
        type: 'b2c',
        paymentMode: 'B2C',
        phone,
        walletCode,
        reference,
        status: 'pending',
        apiKeyId: req.apiKey.id,
        provider
      });

      if (parseFloat(wallet.balance || 0) < parseFloat(amount)) {
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

      // Simulação local: não chamar o gateway M-Pesa, forçar sucesso.
      // try {
      //   providerResponse = await PaymentService.createB2C({
      //     provider,
      //     phone,
      //     amount,
      //     reference,
      //     mode: req.mpesaMode
      //   });
      // } catch (err) {
      //   await transaction.update({
      //     status: 'failed',
      //     providerResponse: JSON.stringify({
      //       error: err.message
      //     })
      //   });
      //
      //   await createAuditLog({
      //     userId: wallet.userId || null,
      //     action: 'transaction_b2c_failed',
      //     entity: 'Transaction',
      //     entityId: transaction.id,
      //     ip: req.ip,
      //     userAgent: req.headers['user-agent']
      //   });
      //
      //   return res.status(400).json({
      //     success: false,
      //     error: err.message
      //   });
      // }

      providerResponse = {
        output_ResponseCode: 'INS-0',
        output_ResponseDescription: 'Request processed successfully',
        output_ConversationID: `SIM-${transaction.id}`,
        output_TransactionID: `SIMTX-${transaction.id}`
      };
      success = true;

      await transaction.update({
        status: success ? 'success' : 'failed',
        providerReference: providerResponse?.output_ConversationID,
        providerTransactionId: providerResponse?.output_TransactionID,
        providerResponse: JSON.stringify(providerResponse),
        providerResponseCode: providerResponse?.output_ResponseCode,
        providerResponseMessage: providerResponse?.output_ResponseDescription
      });

      if (success) {
        const previousBalance = parseFloat(wallet.balance || 0);
        const newBalance = previousBalance - parseFloat(amount);
        wallet.balance = newBalance;

        await sequelize.transaction(async (t) => {
          await wallet.save({ transaction: t });
          await Ledger.create({
            transactionId: transaction.id,
            walletId: wallet.id,
            type: 'debit',
            amount,
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