const router = require('express').Router();
const { Permission } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      attributes: ['name', 'description']
    });
    return res.json({ permissions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
