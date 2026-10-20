const { Wallet, Transaction, WithdrawalRequest, Notification } = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('./PaymentService');
const { moveBalance } = require('./WalletPaymentService');
const { createAuditLog } = require('../helpers/auditLogger');
const { paymentError, responseMessage, toThirdPartyReference } = require('../helpers/mpesaPayment');

function mapProviderStatus(response) {
  if (response?.output_ResponseCode !== 'INS-0') return null;
  const status = String(response.output_ResponseTransactionStatus || '').toLowerCase();
  if (status === 'completed') return 'success';
  if (status === 'cancelled' || status === 'expired') return 'failed';
  return null;
}

class TransactionStatusService {
  async query({ transactionId, userId, isAdmin = false, ip = null, userAgent = null }) {
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction || transaction.provider !== 'mpesa' || !['C2B', 'B2C'].includes(transaction.paymentMode)) {
      throw paymentError('Transação M-Pesa não encontrada.', 404);
    }

    const isReversal = transaction.type === 'reversal';
    const walletId = isReversal
      ? transaction.paymentMode === 'C2B' ? transaction.fromWalletId : transaction.toWalletId
      : transaction.paymentMode === 'C2B' ? transaction.toWalletId : transaction.fromWalletId;
    if (!walletId) throw paymentError('Transação não encontrada.', 404);
    const wallet = isAdmin
      ? await Wallet.findByPk(walletId)
      : await Wallet.findOne({ where: { id: walletId, userId } });
    if (!wallet) throw paymentError('Transação não encontrada.', 404);

    const thirdPartyReference = toThirdPartyReference(transaction.id);
    const queryReference = transaction.providerTransactionId ||
      transaction.providerReference || thirdPartyReference;
    const response = await PaymentService.queryStatus({
      provider: 'mpesa',
      thirdPartyReference,
      queryReference,
      mode: 'live'
    });

    if (response?.output_ThirdPartyReference &&
        String(response.output_ThirdPartyReference).toUpperCase() !== thirdPartyReference) {
      throw paymentError('A referência devolvida pelo M-Pesa não corresponde à transação consultada.', 502);
    }

    const outcome = mapProviderStatus(response);
    let updatedTransaction = transaction;
    if (transaction.status === 'pending' && outcome) {
      updatedTransaction = await sequelize.transaction(async (t) => {
        const lockedTransaction = await Transaction.findByPk(transaction.id, {
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (!lockedTransaction) throw paymentError('Transação não encontrada.', 404);
        if (lockedTransaction.status !== 'pending') return lockedTransaction;

        const original = isReversal
          ? await Transaction.findByPk(lockedTransaction.originalTransactionId, {
            transaction: t,
            lock: t.LOCK.UPDATE
          })
          : null;
        if (isReversal && !original) throw paymentError('Transação original do estorno não encontrada.', 409);

        const lockedWallet = await Wallet.findByPk(walletId, {
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (!lockedWallet) throw paymentError('Carteira da transação não encontrada.', 409);
        const message = responseMessage(response) || `Transação M-Pesa ${outcome === 'success' ? 'concluída' : 'não concluída'}.`;
        await lockedTransaction.update({
          status: outcome,
          providerReference: response.output_ConversationID || lockedTransaction.providerReference,
          providerTransactionId: response.output_TransactionID || lockedTransaction.providerTransactionId,
          providerResponse: JSON.stringify(response),
          providerResponseCode: response.output_ResponseCode,
          providerResponseMessage: responseMessage(response),
          systemErrorCode: null,
          systemErrorMessage: null
        }, { transaction: t });

        const amount = Number(Number(lockedTransaction.amount).toFixed(2));
        if (isReversal && outcome === 'success') {
          await original.update({ status: 'reversed' }, { transaction: t });
          if (lockedTransaction.paymentMode === 'B2C') {
            await moveBalance(lockedWallet, lockedTransaction, amount, 'credit', t);
          }
        } else if (isReversal && outcome === 'failed' && lockedTransaction.paymentMode === 'C2B') {
          await moveBalance(lockedWallet, lockedTransaction, amount, 'credit', t);
        } else if (!isReversal && lockedTransaction.paymentMode === 'C2B' && outcome === 'success') {
          await moveBalance(lockedWallet, lockedTransaction, amount, 'credit', t);
        } else if (!isReversal && lockedTransaction.paymentMode === 'B2C' && outcome === 'failed') {
          const refund = Number((amount + Number(lockedTransaction.fee || 0)).toFixed(2));
          await moveBalance(lockedWallet, lockedTransaction, refund, 'credit', t);
        }

        if (!isReversal && lockedTransaction.paymentMode === 'B2C') {
          const request = await WithdrawalRequest.findOne({
            where: { walletId, reference: lockedTransaction.reference },
            transaction: t,
            lock: t.LOCK.UPDATE
          });
          if (request) {
            await request.update({
              status: outcome === 'success' ? 'approved' : 'rejected',
              adminMessage: message,
              processedAt: new Date()
            }, { transaction: t });
          }
        }

        await Notification.create({
          userId: lockedWallet.userId,
          title: outcome === 'success' ? 'Transação concluída' : 'Transação não realizada',
          message: `Referência ${lockedTransaction.reference}: ${message}`,
          type: outcome === 'success' ? 'success' : 'warning'
        }, { transaction: t });
        await createAuditLog({
          userId: lockedWallet.userId,
          action: `transaction_${isReversal ? 'reversal_' : ''}status_${outcome}`,
          entity: 'Transaction',
          entityId: lockedTransaction.id,
          ip,
          userAgent,
          transaction: t
        });
        return lockedTransaction;
      });
    }

    return {
      success: updatedTransaction.status === 'success',
      pending: updatedTransaction.status === 'pending',
      transactionId: updatedTransaction.id,
      reference: updatedTransaction.reference,
      status: updatedTransaction.status,
      providerStatus: response?.output_ResponseTransactionStatus || null,
      response
    };
  }
}

module.exports = new TransactionStatusService();
