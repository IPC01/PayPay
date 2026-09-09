const { DocumentPage } = require('../models');

function createSlug(title) {
  return title
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class DocumentPageController {
  async getAll(req, res) {
    try {
      const pages = await DocumentPage.findAll({
        order: [['updatedAt', 'DESC']]
      });
      return res.json(pages);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async save(req, res) {
    try {
      const { id, title, content, status } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const slug = createSlug(title);
      let page;

      if (id) {
        page = await DocumentPage.findByPk(id);
        if (!page) {
          return res.status(404).json({ error: 'Document page not found' });
        }
        await page.update({
          title,
          content,
          slug,
          status: status === 'published' ? 'published' : 'draft',
          publishedAt: status === 'published' ? new Date() : null
        });
      } else {
        page = await DocumentPage.create({
          title,
          content,
          slug,
          status: status === 'published' ? 'published' : 'draft',
          publishedAt: status === 'published' ? new Date() : null
        });
      }

      return res.json(page);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const page = await DocumentPage.findByPk(id);
      if (!page) {
        return res.status(404).json({ error: 'Document page not found' });
      }
      await page.destroy();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async listPublic(req, res) {
    try {
      const pages = await DocumentPage.findAll({
        where: { status: 'published' },
        order: [['publishedAt', 'DESC']]
      });
      return res.json(pages);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getPublic(req, res) {
    try {
      const { slug } = req.params;
      const page = await DocumentPage.findOne({
        where: { slug, status: 'published' }
      });
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      return res.json(page);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DocumentPageController();
