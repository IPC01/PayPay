const express = require('express');
const TicketController = require('../controllers/TicketController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', TicketController.getUserTickets);
router.post('/', TicketController.createTicket);
router.get('/:id', TicketController.getTicketById);
router.get('/:id/messages', TicketController.getTicketMessages);
router.post('/:id/messages', TicketController.createMessage);
router.delete('/:id', TicketController.deleteTicket);

module.exports = router;
