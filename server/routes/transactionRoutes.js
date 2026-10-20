const express = require('express');
const TransactionController = require('../controllers/TransactionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', TransactionController.getUserTransactions);
/**
 * @swagger
 * /api/transactions/{id}/status:
 *   get:
 *     summary: Consultar e reconciliar o estado de uma transação M-Pesa
 *     description: Consulta o estado no M-Pesa. Resultados terminais atualizam a transação e liquidam/refundam a carteira de forma idempotente.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Estado terminal da transação.
 *       '202':
 *         description: Estado ainda pendente no M-Pesa.
 *       '404':
 *         description: Transação não encontrada ou não pertence ao utilizador.
 */
router.get('/:id/status', TransactionController.queryStatus);
router.post('/:id/reverse', TransactionController.reverse);

module.exports = router;
