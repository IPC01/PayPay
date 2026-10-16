const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const mpesaRequestMode = require('../middleware/mpesaRequestMode');
const { Wallet } = require('../models');
const PaymentController = require('../controllers/PaymentController');

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

    req.wallet = wallet;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * @swagger
 * /api/payments/c2b:
 *   post:
 *     summary: Customer to Business payment (C2B) authenticated
 *     description: Recebe um pagamento C2B M-Pesa, sem taxa. A referência é opcional. HTTP 202 indica confirmação pendente.
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
 *             properties:
 *               walletCode:
 *                 type: string
 *                 example: WALLET123
 *               amount:
 *                 type: number
 *                 example: 500
 *               phone:
 *                 type: string
 *                 example: "258841234567"
 *               reference:
 *                 type: string
 *                 example: ORDER-001
 *     responses:
 *       '200':
 *         description: Pagamento processado com sucesso.
 */
router.post(
  '/c2b',
  authMiddleware,
  mpesaRequestMode({ forceMode: 'live' }),
  authorizeUserWalletAction,
  PaymentController.c2b.bind(PaymentController)
);

/**
 * @swagger
 * /api/payments/b2c:
 *   post:
 *     summary: Business to Customer payment (B2C) authenticated
 *     description: Executa um saque B2C M-Pesa com custo fixo e reserva de saldo. A referência é opcional. HTTP 202 indica confirmação pendente.
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
 *             properties:
 *               walletCode:
 *                 type: string
 *                 example: WALLET123
 *               amount:
 *                 type: number
 *                 example: 500
 *               phone:
 *                 type: string
 *                 example: "258841234567"
 *               reference:
 *                 type: string
 *                 example: ORDER-001
 *     responses:
 *       '200':
 *         description: Pagamento B2C processado com sucesso.
 */
router.post(
  '/b2c',
  authMiddleware,
  mpesaRequestMode({ forceMode: 'live' }),
  authorizeUserWalletAction,
  PaymentController.b2c.bind(PaymentController)
);

/**
 * @swagger
 * /api/payments/direct:
 *   post:
 *     summary: Pagamento direto na API principal (sem carteira)
 *     description: Processa um pagamento diretamente na API de pagamentos, sem apontar para nenhuma carteira. Usado por fluxos como subscrições de pacotes.
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
 *               - amount
 *               - phone
 *               - reference
 *               - provider
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *               phone:
 *                 type: string
 *                 example: "258841234567"
 *               reference:
 *                 type: string
 *                 example: SUB-001
 *               provider:
 *                 type: string
 *                 example: mpesa
 *     responses:
 *       '200':
 *         description: Pagamento processado com sucesso.
 */
router.post(
  '/direct',
  authMiddleware,
  PaymentController.direct.bind(PaymentController)
);

module.exports = router;
