const express = require('express');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');

const router = express.Router();

router.get('/', authMiddleware,checkPermission('admin:all'), UserController.getAll);
router.get('/:id', authMiddleware, UserController.getById);
router.put('/:id', authMiddleware, UserController.update);
router.delete('/:id', authMiddleware, UserController.delete);

module.exports = router;