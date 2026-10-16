const express = require('express');
const AdminController = require('../controllers/AdminController');
const WithdrawalRequestController = require('../controllers/WithdrawalRequestController');
const SettingsController = require('../controllers/SettingsController');
const DocumentPageController = require('../controllers/DocumentPageController');
const PackageController = require('../controllers/PackageController');
const TransactionController = require('../controllers/TransactionController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');
const supportOrAdmin = require('../middleware/supportOrAdmin');

const router = express.Router();
const adminGuard = [authMiddleware, checkPermission('admin:all')];
const supportGuard = [authMiddleware, supportOrAdmin];

router.get('/stats', adminGuard, AdminController.getStats);
router.get('/wallets', adminGuard, AdminController.getAllWallets);
router.get('/transactions', adminGuard, AdminController.getAllTransactions);
router.post('/transactions/:id/reverse', adminGuard, (req, res, next) => { req.isAdminReversal = true; next(); }, TransactionController.reverse);
router.get('/tickets', supportGuard, AdminController.getAllTickets);
router.get('/tickets/:id/messages', supportGuard, AdminController.getTicketMessages);
router.get('/users/:id/wallets', adminGuard, AdminController.getUserWallets);
router.get('/users/:id/transactions', adminGuard, AdminController.getUserTransactions);
router.get('/withdrawals', adminGuard, WithdrawalRequestController.getAdminRequests);
router.post('/withdrawals/:id/approve', adminGuard, WithdrawalRequestController.approve);
router.post('/withdrawals/:id/reject', adminGuard, WithdrawalRequestController.reject);
router.get('/settings', adminGuard, SettingsController.getSettings);
router.post('/settings', adminGuard, SettingsController.saveSettings);
router.post('/settings/logo-upload', adminGuard, SettingsController.uploadLogo);
router.get('/packages', adminGuard, PackageController.getAll);
router.post('/packages', adminGuard, PackageController.save);
router.delete('/packages/:id', adminGuard, PackageController.delete);
router.get('/subscriptions', adminGuard, AdminController.getSubscriptions);
router.get('/subscription-stats', adminGuard, AdminController.getSubscriptionStats);
router.get('/legal-pages', adminGuard, DocumentPageController.getAll);
router.post('/legal-pages', adminGuard, DocumentPageController.save);
router.delete('/legal-pages/:id', adminGuard, DocumentPageController.delete);

module.exports = router;
