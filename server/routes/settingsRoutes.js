const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const SettingsController = require('../controllers/SettingsController');

const router = express.Router();

router.get('/', authMiddleware, SettingsController.getPublicSettings);

module.exports = router;
