const { Setting } = require('../models');

class SettingsController {
  async getSettings(req, res) {
    try {
      let settings = await Setting.findOne();
      if (!settings) {
        settings = await Setting.create({});
      }
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async saveSettings(req, res) {
    try {
      const payload = {
        platformName: req.body.platformName || '',
        logoImg: req.body.logoImg || null,
        contacts: req.body.contacts || null,
        address: req.body.address || null,
        emails: req.body.emails || null,
        ownerName: req.body.ownerName || null,
        additionalInfo: req.body.additionalInfo || null,
        transactionType: req.body.transactionType || 'C2B'
      };

      let settings = await Setting.findOne();
      if (!settings) {
        settings = await Setting.create(payload);
      } else {
        await settings.update(payload);
      }
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SettingsController();
