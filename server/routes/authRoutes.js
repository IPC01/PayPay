const express = require('express');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// REGISTER
router.post('/register', (req, res) =>
  AuthController.register(req, res)
);

// LOGIN
router.post('/login', (req, res) =>
  AuthController.login(req, res)
);

// LOGOUT (precisa estar autenticado)
router.post('/logout', authMiddleware, (req, res) =>
  AuthController.logout(req, res)
);

// GET current authenticated user
router.get('/me', authMiddleware, (req, res) =>
  AuthController.me(req, res)
);

module.exports = router;