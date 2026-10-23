const { Wallet, WalletType, Transaction, Ledger, WithdrawalRequest, Setting, Notification } = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('./PaymentService');
const { createAuditLog } = require('../helpers/auditLogger');
const {
  paymentError, normalizePhone, normalizeAmount, generateReference, getOutcome, responseMessage,
  sanitizePrefix, toThirdPartyReference
} = require('../helpers/mpesaPayment');

async function generateUniqueReference(prefix, t) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateReference(prefix);
    if (!(await Transaction.findOne({ where: { reference: candidate }, transaction: t }))) return candidate;
  }
  throw paymentError('Não foi possível gerar uma referência única. Tente novamente.', 503);
}

async function moveBalance(wallet, transaction, amount, direction, t) {
  const balanceBefore = Number(wallet.balance);
  const balanceAfter = Number((balanceBefore + (direction === 'credit' ? amount : -amount)).toFixed(2));
  await wallet.update({ balance: balanceAfter }, { transaction: t });
  await Ledger.create({
    transactionId: transaction.id,
    walletId: wallet.id,
    type: direction,
    amount,
    balanceBefore,
    balanceAfter
  }, { transaction: t });
}

class WalletPaymentService {
  async execute({ walletId, walletCode, userId, amount, phone, reference, note, paymentMode, type,
    apiKeyId = null, ip = null, userAgent = null }) {
    const value = normalizeAmount(amount);
    const msisdn = normalizePhone(phone);
    if (!['C2B', 'B2C'].includes(paymentMode)) throw paymentError('Unsupported payment mode');
    if (paymentMode === 'B2C' && !walletId && !walletCode) throw paymentError('Wallet is required');
    if (reference != null && reference !== '' && typeof reference !== 'string') {
      throw paymentError('Invalid transaction reference');
    }
    // A referência enviada pelo cliente é apenas a base inicial (até 8 caracteres
    // alfanuméricos); o sistema associa um código aleatório de 12+ caracteres para
    // garantir que a referência final nunca se repete.
    let providedBase = null;
    if (typeof reference === 'string' && reference.trim()) {
      providedBase = sanitizePrefix(reference);
      if (!providedBase) {
        throw paymentError('A referência inicial deve ter de 1 a 8 caracteres, apenas letras e números.');
      }
    }

    const prepared = await sequelize.transaction(async (t) => {
      let wallet = null;
      let walletPrefix = null;
      let fee = 0;
      if (walletId || walletCode) {
        const where = walletId ? { id: walletId } : { walletCode };
        if (userId != null) where.userId = userId;
        wallet = await Wallet.findOne({ where, transaction: t, lock: t.LOCK.UPDATE });
        if (!wallet) throw paymentError('Wallet not found', 404);
        if (wallet.status !== 'ACTIVE') throw paymentError('Wallet is not active');
        if (wallet.currency !== 'MZN') throw paymentError('M-Pesa only supports MZN wallets');
        const walletType = await WalletType.findByPk(wallet.walletTypeId, { transaction: t });
        if (!walletType?.status || String(walletType.code).toLowerCase() !== 'mpesa') {
          throw paymentError('Apenas carteiras M-Pesa ativas são suportadas.');
        }
        if (paymentMode === 'C2B' && wallet.allowC2B === false) {
          throw paymentError('Wallet is not authorized for C2B transactions', 403);
        }
        if (paymentMode === 'C2B') {
          // Taxa da plataforma (percentagem) retida na entrada de valores C2B
          const settings = await Setting.findOne({ transaction: t });
          const percent = Number(settings?.c2bFeePercent || 0);
          if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
            throw paymentError('Invalid C2B fee configuration', 503);
          }
          fee = Number(((value * percent) / 100).toFixed(2));
        }
        if (paymentMode === 'B2C') {
          if (wallet.allowB2C === false || wallet.allowWithdraw === false) {
            throw paymentError('Wallet is not authorized for B2C withdrawals', 403);
          }
          const settings = await Setting.findOne({ transaction: t });
          // Taxa da plataforma (percentagem) retida no saque B2C
          const percent = Number(settings?.withdrawalFeePercent || 0);
          if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
            throw paymentError('Invalid withdrawal fee configuration', 503);
          }
          fee = Number(((value * percent) / 100).toFixed(2));
          const min = Number(settings?.withdrawalMinValue || 0);
          const max = Number(settings?.withdrawalMaxValue || 0);
          if (value < min) throw paymentError(`O valor mínimo de saque é ${min.toFixed(2)}.`);
          if (max > 0 && value > max) throw paymentError(`O valor máximo de saque é ${max.toFixed(2)}.`);
          if (Number(wallet.balance) < Number((value + fee).toFixed(2))) {
            throw paymentError('Saldo insuficiente para cobrir o saque e a taxa da plataforma.');
          }
        }
        walletPrefix = walletType.referencePrefix;
      }
      // Base inicial: referência enviada pelo cliente, referência da carteira ou
      // prefixo do tipo de carteira + sufixo aleatório; em caso de colisão, um novo
      // sufixo é gerado automaticamente.
      reference = await generateUniqueReference(
        providedBase || sanitizePrefix(wallet?.reference) || walletPrefix,
        t
      );
      const transaction = await Transaction.create({
        fromWalletId: paymentMode === 'B2C' ? wallet.id : null,
        toWalletId: paymentMode === 'C2B' ? wallet?.id || null : null,
        walletCode: wallet?.walletCode || null,
        amount: value,
        fee,
        phone: msisdn,
        reference,
        provider: 'mpesa',
        paymentMode,
        type: paymentMode === 'B2C' ? 'withdrawal' : type || 'c2b',
        status: 'pending',
        apiKeyId
      }, { transaction: t });
      let request = null;
      if (paymentMode === 'B2C') {
        // Persist the reservation before contacting M-Pesa; uncertain results must not release these funds.
        await moveBalance(wallet, transaction, Number((value + fee).toFixed(2)), 'debit', t);
        request = await WithdrawalRequest.create({
          walletId: wallet.id,
          userId: wallet.userId,
          amount: value,
          phone: msisdn,
          reference,
          note: note || null,
          status: 'pending',
          adminMessage: 'A aguardar confirmação B2C do M-Pesa.'
        }, { transaction: t });
      }
      await createAuditLog({
        userId: wallet?.userId || userId,
        action: `transaction_${paymentMode.toLowerCase()}_submitted`,
        entity: 'Transaction',
        entityId: transaction.id,
        ip,
        userAgent,
        transaction: t
      });
      return { transaction, request, walletId: wallet?.id };
    });

    let response = null;
    let outcome;
    let systemErrorMessage = null;
    try {
      const input = {
        provider: 'mpesa',
        phone: msisdn,
        amount: value,
        reference: prepared.transaction.reference,
        thirdPartyReference: toThirdPartyReference(prepared.transaction.id),
        mode: 'live'
      };
      response = paymentMode === 'B2C'
        ? await PaymentService.createB2C(input)
        : await PaymentService.createC2B(input);
      outcome = getOutcome(response);
      if (response?.output_ThirdPartyReference &&
          String(response.output_ThirdPartyReference).toUpperCase() !== toThirdPartyReference(prepared.transaction.id)) {
        outcome = 'pending';
        systemErrorMessage = 'A referência devolvida pelo M-Pesa não corresponde à transferência enviada.';
      }
    } catch (error) {
      console.error(`M-Pesa ${paymentMode} failed for transaction ${prepared.transaction.id}:`, error.message);
      outcome = error.requestNotSent === true ? 'failed' : 'pending';
      systemErrorMessage = error.message;
    }

    // No retry here: a repeated B2C call could transfer funds a second time.
    try {
      return await sequelize.transaction(async (t) => {
        const transaction = await Transaction.findByPk(prepared.transaction.id, {
          transaction: t, lock: t.LOCK.UPDATE
        });
        const message = systemErrorMessage || responseMessage(response) ||
          'Resultado M-Pesa ainda não confirmado. Não repita a transferência.';
        await transaction.update({
          status: outcome,
          providerReference: response?.output_ConversationID || null,
          providerTransactionId: response?.output_TransactionID || null,
          providerResponse: response ? JSON.stringify(response) : null,
          providerResponseCode: response?.output_ResponseCode || null,
          providerResponseMessage: responseMessage(response),
          systemErrorCode: systemErrorMessage ? 'SYS-1001' : null,
          systemErrorMessage
        }, { transaction: t });
        let wallet = null;
        if (prepared.walletId) {
          wallet = await Wallet.findByPk(prepared.walletId, { transaction: t, lock: t.LOCK.UPDATE });
          if (paymentMode === 'C2B' && outcome === 'success') {
            // Credita o valor líquido: a taxa da plataforma (percentagem) fica retida
            const netAmount = Number((value - Number(transaction.fee || 0)).toFixed(2));
            await moveBalance(wallet, transaction, netAmount, 'credit', t);
          } else if (paymentMode === 'B2C' && outcome === 'failed') {
            await moveBalance(wallet, transaction, Number((value + Number(transaction.fee)).toFixed(2)), 'credit', t);
          }
        }
        const request = prepared.request;
        if (request) {
          await request.update({
            status: outcome === 'success' ? 'approved' : outcome === 'failed' ? 'rejected' : 'pending',
            adminMessage: message,
            processedAt: outcome === 'pending' ? null : new Date()
          }, { transaction: t });
          await Notification.create({
            userId: wallet.userId,
            title: outcome === 'success' ? 'Saque concluído' : outcome === 'failed' ? 'Saque não realizado' : 'Saque em confirmação',
            message: `Referência ${transaction.reference}: ${message}`,
            type: outcome === 'success' ? 'success' : 'warning'
          }, { transaction: t });
        }
        await createAuditLog({
          userId: wallet?.userId || userId,
          action: `transaction_${paymentMode.toLowerCase()}_${outcome}`,
          entity: 'Transaction',
          entityId: transaction.id,
          ip,
          userAgent,
          transaction: t
        });
        return {
          success: outcome === 'success',
          pending: outcome === 'pending',
          provider: 'mpesa',
          transactionId: transaction.id,
          reference: transaction.reference,
          message,
          transaction,
          request,
          response
        };
      });
    } catch (error) {
      console.error(`Failed to persist M-Pesa result for ${prepared.transaction.id}:`, error.message);
      return {
        success: false,
        pending: true,
        provider: 'mpesa',
        transactionId: prepared.transaction.id,
        reference: prepared.transaction.reference,
        message: 'A resposta M-Pesa requer reconciliação. Não repita a transferência; consulte o suporte com esta referência.'
      };
    }
  }
}

module.exports = new WalletPaymentService();
module.exports.moveBalance = moveBalance;
module.exports.generateUniqueReference = generateUniqueReference;
