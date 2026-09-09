const { Package } = require('../models');

class PackageController {
  async getAll(req, res) {
    try {
      const packages = await Package.findAll({
        order: [['price', 'ASC']]
      });
      return res.json(packages);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const pack = await Package.findByPk(id);
      if (!pack) {
        return res.status(404).json({ error: 'Package not found' });
      }
      return res.json(pack);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getActive(req, res) {
    try {
      const packages = await Package.findAll({
        where: { active: true },
        order: [['price', 'ASC']]
      });
      return res.json(packages);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async save(req, res) {
    try {
      const { id, code, name, price, promoPrice, promoStartDate, promoEndDate, description, permissionsGranted, permissionsDenied, active } = req.body;
      const payload = {
        code,
        name,
        price: parseFloat(price) || 0.0,
        promoPrice: promoPrice ? parseFloat(promoPrice) : null,
        promoStartDate: promoStartDate ? new Date(promoStartDate) : null,
        promoEndDate: promoEndDate ? new Date(promoEndDate) : null,
        description: description || null,
        permissionsGranted: permissionsGranted || null,
        permissionsDenied: permissionsDenied || null,
        active: typeof active !== 'undefined' ? Boolean(active) : true
      };

      let pack;
      if (id) {
        pack = await Package.findByPk(id);
        if (!pack) {
          return res.status(404).json({ error: 'Package not found' });
        }
        await pack.update(payload);
      } else {
        pack = await Package.create(payload);
      }

      return res.json(pack);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const pack = await Package.findByPk(id);
      if (!pack) {
        return res.status(404).json({ error: 'Package not found' });
      }
      await pack.destroy();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PackageController();
