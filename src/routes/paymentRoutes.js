
/**
 * @swagger
 * /api/v1/mpesa/c2b:
 *   post:
 *     summary: Customer to Business payment (C2B)
 *     description: Processa pagamento simulado via wallet
 *     tags:
 *       - Payments
 *     security:
 *       - apiKeyAuth: []
 *      
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
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Server error
 */
const router = require('express').Router();

const PaymentController = require('../controllers/PaymentController');
const checkPermission = require('../middleware/checkPermission');
const authMiddleware = require('../middleware/authMiddleware');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');
const authorizeWalletAction = require('../middleware/authorizeWalletAction');

router.post(
  '/c2b',
  apiKeyMiddleware,  
                      
  authorizeWalletAction('admin:all','wallet:create'),   
  PaymentController.c2b             
);


module.exports = router;