const { Op } = require('sequelize');
const { Wallet, WalletType, Transaction, Notification } = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('./PaymentService');
const { moveBalance, generateUniqueReference } = require('./WalletPaymentService');
const { createAuditLog } = require('../helpers/auditLogger');
const {
  paymentError, getOutcome, responseMessage, toThirdPartyReference
} = require('../helpers/mpesaPayment');

class TransactionReversalService {
  // Full reversal of a successful wallet C2B/B2C transaction.
  // C2B: the amount is reserved (debited) from the wallet before contacting M-Pesa.
  // B2C: only the withdrawn amount (not the withdrawal fee) returns to the wallet on success.
  async execute({ transactionId, userId, isAdmin = false, ip = null, userAgent = null }) {
    if (!transactionId) throw paymentError('Transaction is required');

    const prepared = await sequelize.transaction(async (t) => {
      const original = await Transaction.findByPk(transactionId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!original) throw paymentError('Transação não encontrada.', 404);
      if (original.type === 'reversal') throw paymentError('Um estorno não pode ser estornado.');
      if (!['C2B', 'B2C'].includes(original.paymentMode)) {
        throw paymentError('Apenas transações C2B ou B2C podem ser estornadas.');
      }
      if (original.status !== 'success') {
        throw paymentError('Apenas transações concluídas com sucesso podem ser estornadas.');
      }
      if (!original.providerTransactionId) {
        throw paymentError('A transação não tem o ID M-Pesa necessário para o estorno.');
      }
      const walletId = original.paymentMode === 'C2B' ? original.toWalletId : original.fromWalletId;
      if (!walletId) throw paymentError('Apenas transações de carteira podem ser estornadas.');

      const wallet = await Wallet.findByPk(walletId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!wallet || (!isAdmin && wallet.userId !== userId)) {
        throw paymentError('Transação não encontrada.', 404);
      }

      const existing = await Transaction.findOne({
        where: { originalTransactionId: original.id, status: { [Op.in]: ['pending', 'success'] } },
        transaction: t
      });
      if (existing) throw paymentError('Esta transação já tem um estorno concluído ou em processamento.', 409);

      const amount = Number(Number(original.amount).toFixed(2));
      if (original.paymentMode === 'C2B' && Number(wallet.balance) < amount) {
        throw paymentError('Saldo insuficiente na carteira para estornar este depósito.');
      }

      const walletType = await WalletType.findByPk(wallet.walletTypeId, { transaction: t });
      const reference = await generateUniqueReference(walletType?.referencePrefix, t);
      const reversal = await Transaction.create({
        fromWalletId: original.paymentMode === 'C2B' ? wallet.id : null,
        toWalletId: original.paymentMode === 'B2C' ? wallet.id : null,
        walletCode: wallet.walletCode,
        amount,
        fee: 0,
        phone: original.phone,
        reference,
        provider: 'mpesa',
        paymentMode: original.paymentMode,
        type: 'reversal',
        status: 'pending',
        originalTransactionId: original.id
      }, { transaction: t });

      if (original.paymentMode === 'C2B') {
        // Reserve before contacting M-Pesa so the funds cannot be withdrawn meanwhile.
        await moveBalance(wallet, reversal, amount, 'debit', t);
      }

      await createAuditLog({
        userId, action: 'transaction_reversal_submitted', entity: 'Transaction', entityId: reversal.id,
        ip, userAgent, transaction: t
      });
      return { original, reversal, walletId: wallet.id, amount };
    });

    let response = null;
    let outcome;
    let systemErrorMessage = null;
    const thirdPartyReference = toThirdPartyReference(prepared.reversal.id);
    try {
      response = await PaymentService.reverse({
        provider: 'mpesa',
        transactionId: prepared.original.providerTransactionId,
        thirdPartyReference,
        mode: 'live'
      });
      outcome = getOutcome(response);
      if (response?.output_ThirdPartyReference &&
          String(response.output_ThirdPartyReference).toUpperCase() !== thirdPartyReference) {
        outcome = 'pending';
        systemErrorMessage = 'A referência devolvida pelo M-Pesa não corresponde ao estorno enviado.';
      }
    } catch (error) {
      console.error(`M-Pesa reversal failed for transaction ${prepared.reversal.id}:`, error.message);
      outcome = error.requestNotSent === true ? 'failed' : 'pending';
      systemErrorMessage = error.message;
    }

    try {
      return await sequelize.transaction(async (t) => {
        const reversal = await Transaction.findByPk(prepared.reversal.id, { transaction: t, lock: t.LOCK.UPDATE });
        const original = await Transaction.findByPk(prepared.original.id, { transaction: t, lock: t.LOCK.UPDATE });
        const wallet = await Wallet.findByPk(prepared.walletId, { transaction: t, lock: t.LOCK.UPDATE });
        const message = systemErrorMessage || responseMessage(response) ||
          'Resultado do estorno M-Pesa ainda não confirmado. Não repita o pedido.';

        await reversal.update({
          status: outcome,
          providerReference: response?.output_ConversationID || null,
          providerTransactionId: response?.output_TransactionID || null,
          providerResponse: response ? JSON.stringify(response) : null,
          providerResponseCode: response?.output_ResponseCode || null,
          providerResponseMessage: responseMessage(response),
          systemErrorCode: systemErrorMessage ? 'SYS-1001' : null,
          systemErrorMessage
        }, { transaction: t });

        if (outcome === 'success') {
          await original.update({ status: 'reversed' }, { transaction: t });
          if (original.paymentMode === 'B2C') {
            await moveBalance(wallet, reversal, prepared.amount, 'credit', t);
          }
        } else if (outcome === 'failed' && original.paymentMode === 'C2B') {
          await moveBalance(wallet, reversal, prepared.amount, 'credit', t);
        }

        await Notification.create({
          userId: wallet.userId,
          title: outcome === 'success' ? 'Estorno concluído' : outcome === 'failed' ? 'Estorno não realizado' : 'Estorno em confirmação',
          message: `Referência ${original.reference}: ${message}`,
          type: outcome === 'success' ? 'success' : 'warning'
        }, { transaction: t });
        await createAuditLog({
          userId, action: `transaction_reversal_${outcome}`, entity: 'Transaction', entityId: reversal.id,
          ip, userAgent, transaction: t
        });

        return {
          success: outcome === 'success',
          pending: outcome === 'pending',
          provider: 'mpesa',
          transactionId: reversal.id,
          originalTransactionId: original.id,
          reference: reversal.reference,
          message,
          transaction: reversal,
          response
        };
      });
    } catch (error) {
      console.error(`Failed to persist M-Pesa reversal result for ${prepared.reversal.id}:`, error.message);
      return {
        success: false,
        pending: true,
        provider: 'mpesa',
        transactionId: prepared.reversal.id,
        originalTransactionId: prepared.original.id,
        reference: prepared.reversal.reference,
        message: 'A resposta do estorno M-Pesa requer reconciliação. Não repita o pedido; consulte o suporte com esta referência.'
      };
    }
  }
}

module.exports = new TransactionReversalService();
