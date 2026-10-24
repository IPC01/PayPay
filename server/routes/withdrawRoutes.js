const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const confirmWithdrawalPassword = require('../middleware/confirmWithdrawalPassword');
const WithdrawalRequestController = require('../controllers/WithdrawalRequestController');

router.use(authMiddleware);

router.post('/', confirmWithdrawalPassword, WithdrawalRequestController.create);
router.get('/', WithdrawalRequestController.getUserRequests);

module.exports = router;
