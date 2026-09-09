const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const NotificationController = require('../controllers/NotificationController');

router.use(authMiddleware);

router.get('/', NotificationController.getNotifications);
router.patch('/:id/read', NotificationController.markRead);

module.exports = router;
