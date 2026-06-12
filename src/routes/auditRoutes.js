const express = require('express');
const AuditLogController = require('../controllers/AuditLog');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', AuditLogController.list);
router.post('/events', AuditLogController.create);

module.exports = router;
