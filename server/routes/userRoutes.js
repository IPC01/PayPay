const express = require('express');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');

const router = express.Router();

function selfOrAdmin(req, res, next) {
	const targetUserId = Number(req.params.id);

	if (req.user?.userId === targetUserId) {
		return next();
	}

	return checkPermission('admin:all')(req, res, next);
}

router.get('/', authMiddleware, checkPermission('admin:all'), UserController.getAll);
router.post('/', authMiddleware, checkPermission('admin:all'), UserController.create);
router.get('/:id', authMiddleware, selfOrAdmin, UserController.getById);
router.put('/:id', authMiddleware, selfOrAdmin, UserController.update);
router.delete('/:id', authMiddleware, checkPermission('admin:all'), UserController.delete);

module.exports = router;