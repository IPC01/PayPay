const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const PaymentController = require('../controllers/PaymentController');

// Compatibility alias; there is no separate simulated or legacy payment path.
router.post('/c2b', authMiddleware, PaymentController.c2b);

module.exports = router;
