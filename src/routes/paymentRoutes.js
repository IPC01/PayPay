/**
 * @swagger
 * /api/v1/mpesa/c2b:
 *   post:
 *     summary: Customer to Business payment (C2B)
 *     description: Processa um pagamento C2B usando a carteira especificada.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pagamento C2B processado com sucesso.
 *                 transactionId:
 *                   type: string
 *                   example: 9f8d7c6b-1234-4abc-9d0e-1f2a3b4c5d6e
 *       '400':
 *         description: Requisição inválida.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid wallet code
 *       '401':
 *         description: Erro de autenticação ou token inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid API key token
 *       '500':
 *         description: Erro interno do servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
const router = require('express').Router();

const PaymentController = require('../controllers/PaymentController');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');
const authorizeWalletAction = require('../middleware/authorizeWalletAction');
const mpesaRequestMode = require('../middleware/mpesaRequestMode');

/**
 * @swagger
 * /api/v1/mpesa/b2c:
 *   post:
 *     summary: Business to Customer payment (B2C)
 *     description: Processa um pagamento B2C a partir da carteira especificada.
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
 *                   example: mpesa
 *                 transactionId:
 *                   type: string
 *                   example: 9f8d7c6b-1234-4abc-9d0e-1f2a3b4c5d6e
 *                 response:
 *                   type: object
 *                   description: Resposta do provedor de pagamento
 *       '400':
 *         description: Requisição inválida ou saldo insuficiente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Insufficient wallet balance
 *       '401':
 *         description: Erro de autenticação ou token inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid API key token
 *       '500':
 *         description: Erro interno do servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post(
  '/c2b',
  mpesaRequestMode(),
  apiKeyMiddleware,
  authorizeWalletAction('wallet:deposit'),
  PaymentController.c2b
);

router.post(
  '/b2c',
  mpesaRequestMode(),
  apiKeyMiddleware,
  authorizeWalletAction('wallet:withdraw'),
  PaymentController.b2c
);

router.post(
  '/mock/c2b',
  mpesaRequestMode({ forceMode: 'mock' }),
  apiKeyMiddleware,
  authorizeWalletAction('wallet:deposit'),
  PaymentController.c2b
);

router.post(
  '/mock/b2c',
  mpesaRequestMode({ forceMode: 'mock' }),
  apiKeyMiddleware,
  authorizeWalletAction('wallet:withdraw'),
  PaymentController.b2c
);


module.exports = router;