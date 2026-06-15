const express = require('express');
const WalletTypeController = require('../controllers/WalletTypeController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');

const router = express.Router();

router.use(authMiddleware);

router.get('/', WalletTypeController.getAll);
router.put('/:id', checkPermission('admin:all'), WalletTypeController.update);

module.exports = router;
