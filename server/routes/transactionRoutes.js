const express = require('express');
const TransactionController = require('../controllers/TransactionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', TransactionController.getUserTransactions);

module.exports = router;
