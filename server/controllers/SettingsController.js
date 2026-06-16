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

  async getPublicSettings(req, res) {
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

  async uploadLogo(req, res) {
    try {
      const { fileName, data } = req.body;
      if (!fileName || !data) {
        return res.status(400).json({ error: 'fileName and data are required' });
      }

      const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uploadDir = require('path').join(__dirname, '../uploads/settings');
      const fs = require('fs');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fullPath = require('path').join(uploadDir, sanitizedFileName);
      fs.writeFileSync(fullPath, buffer);
      const logoUrl = `/uploads/settings/${sanitizedFileName}`;
      return res.json({ logoImg: logoUrl });
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
        additionalInfo: req.body.additionalInfo || null
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
