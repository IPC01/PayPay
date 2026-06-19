const express = require('express');
const SettingsController = require('../controllers/SettingsController');

const router = express.Router();

// Public endpoint to expose company/platform settings for login pages and public branding.
router.get('/', SettingsController.getPublicSettings);

module.exports = router;
