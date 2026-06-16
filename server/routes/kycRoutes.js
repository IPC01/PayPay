const express = require('express');
const KycController = require('../controllers/KycController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');

const router = express.Router();

router.use(authMiddleware);

router.get('/', KycController.getMyKyc);
router.post('/', KycController.upsertKyc);
router.post('/submit', KycController.submitKyc);
router.post('/documents', KycController.uploadDocument);
router.get('/documents', KycController.listDocuments);
router.delete('/documents/:id', KycController.deleteDocument);

const adminGuard = [authMiddleware, checkPermission('admin:all')];
router.get('/admin', adminGuard, KycController.getAdminKycs);
router.get('/admin/:id', adminGuard, KycController.getAdminKycById);
router.post('/admin/:id/review', adminGuard, KycController.reviewKyc);

module.exports = router;
