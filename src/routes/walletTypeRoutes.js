const express = require('express');
const WalletTypeController = require('../controllers/WalletTypeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', WalletTypeController.getAll);

module.exports = router;
