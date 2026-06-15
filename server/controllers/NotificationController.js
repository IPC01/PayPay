const { Notification } = require('../models');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const notifications = await Notification.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async markRead(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const notification = await Notification.findOne({
        where: { id, userId }
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      notification.read = true;
      await notification.save();

      return res.json(notification);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new NotificationController();
