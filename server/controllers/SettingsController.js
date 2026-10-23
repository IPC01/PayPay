const { Setting } = require('../models');

class SettingsController {
  async getSettings(req, res) {
    try {
      let settings = await Setting.findOne();
      if (!settings) {
        settings = await Setting.create({ platformName: 'SAMPAY' });
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
        settings = await Setting.create({ platformName: 'SAMPAY' });
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
      const logoUrl = `${req.protocol}://${req.get('host')}/api/uploads/settings/${sanitizedFileName}`;
      return res.json({ logoImg: logoUrl });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async saveSettings(req, res) {
    try {
      // Taxas da plataforma em percentagem (0-100, até 2 casas decimais)
      const parsePercent = (raw) => {
        const value = Number(raw ?? 0);
        if (!Number.isFinite(value) || value < 0 || value > 100 ||
            Math.abs(value - Number(value.toFixed(2))) > 0.000001) {
          return null;
        }
        return Number(value.toFixed(2));
      };
      const c2bFeePercent = parsePercent(req.body.c2bFeePercent);
      const withdrawalFeePercent = parsePercent(req.body.withdrawalFeePercent);
      if (c2bFeePercent === null || withdrawalFeePercent === null) {
        return res.status(400).json({ error: 'As taxas da plataforma devem ser percentagens entre 0 e 100 com até duas casas decimais.' });
      }
      const payload = {
        c2bFeePercent,
        withdrawalFeePercent,
        withdrawalMinValue: Number.isFinite(parseFloat(req.body.withdrawalMinValue)) ? parseFloat(req.body.withdrawalMinValue) : 0.0,
        withdrawalMaxValue: Number.isFinite(parseFloat(req.body.withdrawalMaxValue)) ? parseFloat(req.body.withdrawalMaxValue) : 0.0
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
