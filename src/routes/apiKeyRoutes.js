const router = require('express').Router();

const ApiKeyController = require('../controllers/ApiKeyController');
const authMiddleware = require('../middleware/authMiddleware');

// criar api key
router.post(
  '/api-keys',
  authMiddleware,
  ApiKeyController.create
);

module.exports = router;