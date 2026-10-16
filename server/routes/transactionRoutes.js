const express = require('express');
const TransactionController = require('../controllers/TransactionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', TransactionController.getUserTransactions);
router.post('/:id/reverse', TransactionController.reverse);

module.exports = router;
