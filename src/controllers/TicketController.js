const { Ticket, TicketMessage, User } = require('../models');

class TicketController {
  async createTicket(req, res) {
    try {
      const userId = req.user.userId;
      const { subject, description, priority = 'normal' } = req.body;

      if (!subject || !description) {
        return res.status(400).json({ error: 'Subject and description are required' });
      }

      const ticket = await Ticket.create({
        userId,
        subject,
        description,
        priority,
        status: 'open'
      });

      return res.status(201).json(ticket);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getUserTickets(req, res) {
    try {
      const userId = req.user.userId;

      const tickets = await Ticket.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']]
      });

      return res.json(tickets);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const ticket = await Ticket.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      if (ticket.userId !== req.user.userId && req.user.roleId !== 1) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.json(ticket);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getTicketMessages(req, res) {
    try {
      const { id } = req.params;
      const ticket = await Ticket.findByPk(id);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const isOwner = ticket.userId === req.user.userId;
      const isAdmin = req.user.roleId === 1;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const messages = await TicketMessage.findAll({
        where: { ticketId: id },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      return res.json({ ticket, messages });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createMessage(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const ticket = await Ticket.findByPk(id);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const isOwner = ticket.userId === req.user.userId;
      const isAdmin = req.user.roleId === 1;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (!message) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      const ticketMessage = await TicketMessage.create({
        ticketId: id,
        userId: req.user.userId,
        senderType: isAdmin ? 'admin' : 'user',
        message
      });

      if (isAdmin && ticket.status === 'open') {
        ticket.status = 'pending';
        await ticket.save();
      }

      return res.status(201).json(ticketMessage);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TicketController();
