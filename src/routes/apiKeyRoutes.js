const router = require('express').Router();

const ApiKeyController = require('../controllers/ApiKeyController');
const authMiddleware = require('../middleware/authMiddleware');

router.get(
  '/',
  authMiddleware,
  ApiKeyController.list
);

router.post(
  '/',
  authMiddleware,
  ApiKeyController.create
);

router.patch(
  '/:id',
  authMiddleware,
  ApiKeyController.update
);

router.delete(
  '/:id',
  authMiddleware,
  ApiKeyController.delete
);

module.exports = router;
