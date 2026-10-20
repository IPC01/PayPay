const express = require('express');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');
const { staffAccess, customerTarget, isOperator } = require('../middleware/staffAccess');

const router = express.Router();

function selfOrAdmin(req, res, next) {
	const targetUserId = Number(req.params.id);

	if (req.user?.userId === targetUserId) {
		return next();
	}

	return staffAccess(req, res, () => customerTarget(req, res, next));
}

router.get('/', authMiddleware, staffAccess, UserController.getAll);
router.post('/', authMiddleware, checkPermission('admin:all'), UserController.create);
router.get('/:id', authMiddleware, selfOrAdmin, UserController.getById);
router.put('/:id', authMiddleware, selfOrAdmin, (req, res, next) => {
	if (isOperator(req.user) && Object.keys(req.body).some((key) => key !== 'isActive') && Number(req.params.id) !== req.user.userId) {
		return res.status(403).json({ error: 'O operador só pode bloquear ou desbloquear clientes' });
	}
	if (req.body.roleId !== undefined || req.body.isActive !== undefined) {
		if (isOperator(req.user)) return customerTarget(req, res, next);
		return checkPermission('admin:all')(req, res, next);
	}
	return next();
}, UserController.update);
router.delete('/:id', authMiddleware, checkPermission('admin:all'), UserController.delete);

module.exports = router;