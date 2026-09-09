const express = require('express');
const SubscriptionController = require('../controllers/SubscriptionController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');

const router = express.Router();

router.use(authMiddleware);
router.get('/', SubscriptionController.getUserSubscriptions);
router.post('/subscribe', SubscriptionController.subscribe);
router.post('/renew', SubscriptionController.renew);

module.exports = router;
