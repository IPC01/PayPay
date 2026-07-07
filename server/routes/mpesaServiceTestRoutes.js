const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const { Wallet, Transaction, Ledger } = require('../models');
const sequelize = require('../config/database');
const PaymentController = require('../controllers/PaymentController');
const { pagamentoMpesa } = require('../services/mpesa');

async function authorizeUserWalletAction(req, res, next) {
  try {
    const { walletCode } = req.body;

    if (!walletCode) {
      return res.status(400).json({ error: 'walletCode is required' });
    }

    const wallet = await Wallet.findOne({
      where: {
        walletCode,
        userId: req.user.userId
      }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (wallet.status !== 'ACTIVE') {
      return res.status(400).json({ error: `Wallet is not active (${wallet.status})` });
    }

    if (wallet.allowC2B === false) {
      return res.status(403).json({ error: 'Wallet is not authorized for C2B transactions' });
    }

    req.wallet = wallet;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * @swagger
 * /api/mpesa-service-test/c2b:
 *   post:
 *     summary: Teste de pagamento C2B via service legado M-Pesa
 *     description: Executa o método legado `pagamentoMpesa` para testar integração C2B com M-Pesa.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletCode
 *               - amount
 *               - phone
 *               - reference
 *             properties:
 *               walletCode:
 *                 type: string
 *                 example: WALLET123
 *                 description: Carteira do utilizador autenticado que receberá o crédito se o teste for bem-sucedido.
 *               amount:
 *                 type: number
 *                 example: 500
 *               phone:
 *                 type: string
 *                 example: "258841234567"
 *                 description: Aceita os formatos 841234567, 0841234567 ou 258841234567. Também aceita `phoneNumber` por compatibilidade.
 *               phoneNumber:
 *                 type: string
 *                 example: "841234567"
 *                 description: Campo alternativo compatível com implementações antigas.
 *               reference:
 *                 type: string
 *                 example: ORDER-001
 *                 description: Referência única da transação de teste.
 *     responses:
 *       '200':
 *         description: Teste C2B processado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 provider:
 *                   type: string
 *                   example: mpesa-test
 *                 transactionId:
 *                   type: string
 *                   example: 9f8d7c6b-1234-4abc-9d0e-1f2a3b4c5d6e
 *                 response:
 *                   type: object
 *                   description: Resposta devolvida pela biblioteca `mpesa-node-api`.
 *       '400':
 *         description: Dados inválidos ou falha devolvida pelo provedor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 provider:
 *                   type: string
 *                   example: mpesa-test
 *                 transactionId:
 *                   type: string
 *                   example: 9f8d7c6b-1234-4abc-9d0e-1f2a3b4c5d6e
 *                 response:
 *                   type: object
 *                   example:
 *                     output_ResponseCode: INS-2051
 *                     output_ResponseDesc: MSISDN invalid.
 *       '500':
 *         description: Falha interna ao executar o teste C2B.
 */
/**
 * Rota simples para testar o service legado de M-Pesa.
 * Body esperado: { walletCode: string, amount: number|string, reference: string, phone?: string, phoneNumber?: string }
 */
router.post('/c2b', authMiddleware, authorizeUserWalletAction, async (req, res) => {
  try {
    const {
      walletCode,
      amount,
      reference,
      phone,
      phoneNumber
    } = req.body;
    const targetPhone = phone ?? phoneNumber;
    const wallet = req.wallet;

    if (!walletCode || !reference || amount === undefined || amount === null || targetPhone === undefined || targetPhone === null) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: walletCode, amount, reference e phone/phoneNumber'
      });
    }

    const existingTransaction = await Transaction.findOne({
      where: { reference }
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Reference already used for another transaction'
      });
    }

    const provider = 'mpesa-test';
    const feeAmount = await PaymentController.getFeeAmount(wallet.walletTypeId, 'c2b', amount);
    const transaction = await Transaction.create({
      fromWalletId: wallet.id,
      toWalletId: null,
      amount,
      fee: feeAmount,
      type: 'c2b',
      paymentMode: 'C2B',
      phone: String(targetPhone).trim(),
      walletCode,
      reference,
      status: 'pending',
      provider
    });

    const result = await pagamentoMpesa(amount, String(targetPhone).trim());
    const providerResponse = result.data || null;
    const success = result.success && providerResponse?.output_ResponseCode === 'INS-0';
    const providerResponseMessage =
      providerResponse?.output_ResponseDescription ||
      providerResponse?.output_ResponseDesc ||
      result.error ||
      null;

    await transaction.update({
      status: success ? 'success' : 'failed',
      providerReference: providerResponse?.output_ConversationID || null,
      providerTransactionId: providerResponse?.output_TransactionID || null,
      providerResponse: JSON.stringify(providerResponse || { error: result.error || result.message }),
      providerResponseCode: providerResponse?.output_ResponseCode || null,
      providerResponseMessage,
      systemErrorMessage: success ? null : result.error || result.message || providerResponseMessage
    });

    if (success) {
      const previousBalance = parseFloat(wallet.balance || 0);
      const amountValue = parseFloat(amount) || 0;
      const netAmount = Math.max(0, amountValue - feeAmount);
      const newBalance = previousBalance + netAmount;
      wallet.balance = newBalance;

      await sequelize.transaction(async (dbTransaction) => {
        await wallet.save({ transaction: dbTransaction });
        await Ledger.create({
          transactionId: transaction.id,
          walletId: wallet.id,
          type: 'credit',
          amount: netAmount,
          balanceBefore: previousBalance,
          balanceAfter: newBalance
        }, { transaction: dbTransaction });
      });
    }

    const statusCode = success ? 200 : 400;
    const responsePayload = providerResponse || {
      error: result.error || result.message,
      reference: result.reference
    };

    return res.status(statusCode).json({
      success,
      provider,
      transactionId: transaction.id,
      response: responsePayload
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Falha ao executar teste de M-Pesa',
      error: error.message
    });
  }
});

module.exports = router;