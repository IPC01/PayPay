const fs = require('fs');
const path = require('path');
const { Ticket, TicketMessage, User, Notification } = require('../models');

async function saveTicketAttachment(attachment, filename) {
  if (!attachment) return null;

  const uploadsDir = path.join(__dirname, '../uploads/tickets');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const matches = attachment.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) return null;

  const extension = filename ? path.extname(filename) : `.${matches[1].split('/')[1]}`;
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const fileData = Buffer.from(matches[2], 'base64');

  fs.writeFileSync(filePath, fileData);
  return `/api/uploads/tickets/${fileName}`;
}

class TicketController {
  async createTicket(req, res) {
    try {
      const userId = req.user.userId;
      const { subject, description, priority = 'normal', attachment, attachmentName } = req.body;

      if (!subject || !description) {
        return res.status(400).json({ error: 'Subject and description are required' });
      }

      const attachmentUrl = await saveTicketAttachment(attachment, attachmentName);

      const ticket = await Ticket.create({
        userId,
        subject,
        description,
        priority,
        status: 'open',
        attachmentUrl
      });

      const admins = await User.findAll({ where: { roleId: 1 } });
      await Promise.all(admins.map((admin) =>
        Notification.create({
          userId: admin.id,
          title: 'Novo ticket de suporte',
          message: `O utilizador abriu um novo ticket: ${subject}`,
          type: 'info'
        })
      ));

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

      if (isAdmin && ticket.userId !== req.user.userId) {
        await Notification.create({
          userId: ticket.userId,
          title: 'Resposta ao seu ticket',
          message: `O administrador respondeu ao seu ticket: ${ticket.subject}`,
          type: 'info'
        });
      }

      return res.status(201).json(ticketMessage);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteTicket(req, res) {
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

      await ticket.destroy();
      return res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TicketController();
