const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const DocumentPageController = require('../controllers/DocumentPageController');

const router = express.Router();

router.get('/', authMiddleware, DocumentPageController.listPublic);
router.get('/:slug', authMiddleware, DocumentPageController.getPublic);

module.exports = router;
