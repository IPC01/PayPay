const express = require('express');
const AdminController = require('../controllers/AdminController');
const WithdrawalRequestController = require('../controllers/WithdrawalRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');
const supportOrAdmin = require('../middleware/supportOrAdmin');

const router = express.Router();
const adminGuard = [authMiddleware, checkPermission('admin:all')];
const supportGuard = [authMiddleware, supportOrAdmin];

router.get('/stats', adminGuard, AdminController.getStats);
router.get('/wallets', adminGuard, AdminController.getAllWallets);
router.get('/transactions', adminGuard, AdminController.getAllTransactions);
router.get('/tickets', supportGuard, AdminController.getAllTickets);
router.get('/tickets/:id/messages', supportGuard, AdminController.getTicketMessages);
router.get('/users/:id/wallets', adminGuard, AdminController.getUserWallets);
router.get('/users/:id/transactions', adminGuard, AdminController.getUserTransactions);
router.get('/withdrawals', adminGuard, WithdrawalRequestController.getAdminRequests);
router.post('/withdrawals/:id/approve', adminGuard, WithdrawalRequestController.approve);
router.post('/withdrawals/:id/reject', adminGuard, WithdrawalRequestController.reject);

module.exports = router;
