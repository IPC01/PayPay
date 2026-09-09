const express = require('express');
const PackageController = require('../controllers/PackageController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission');

const router = express.Router();

router.use(authMiddleware);
router.get('/', PackageController.getActive);
router.get('/all', checkPermission('admin:all'), PackageController.getAll);
router.get('/:id', PackageController.getById);
router.post('/', checkPermission('admin:all'), PackageController.save);
router.delete('/:id', checkPermission('admin:all'), PackageController.delete);

module.exports = router;
