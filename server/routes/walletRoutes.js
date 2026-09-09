const express = require('express');
const router = express.Router();
const walletController = require('../controllers/WalletController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas protegidas (requerem autenticação)
router.use(authMiddleware);

// Criar nova carteira
router.post('/', walletController.create);

// Listar todas as carteiras do usuário
router.get('/', walletController.getUserWallets);

// Buscar carteira por código
router.get('/code/:code', walletController.getByCode);

// Buscar carteira por ID
router.get('/:id', walletController.getById);

// Atualizar carteira
router.put('/:id', walletController.update);

// Atualizar status da carteira (apenas admin)
router.put('/:id/status', walletController.updateStatus);

// Soft delete / fechar carteira
router.delete('/:id', walletController.softDelete);

module.exports = router;