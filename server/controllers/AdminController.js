const { Op } = require('sequelize');
const { User, Wallet, WalletType, Transaction, Ticket, TicketMessage } = require('../models');

class AdminController {
  async getStats(req, res) {
    try {
      const now = new Date();
      const days = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(now);
        day.setDate(now.getDate() - (6 - index));
        day.setHours(0, 0, 0, 0);
        return day;
      });

      const [userCount, walletCount, transactionCount, activeWalletCount, openTicketCount, pendingTransactionsCount] = await Promise.all([
        User.count(),
        Wallet.count(),
        Transaction.count(),
        Wallet.count({ where: { status: 'ACTIVE' } }),
        Ticket.count({ where: { status: { [Op.in]: ['open', 'pending'] } } }),
        Transaction.count({ where: { status: 'pending' } })
      ]);

      const weeklyGrowth = await Promise.all(
        days.map(async (day) => {
          const nextDay = new Date(day);
          nextDay.setDate(day.getDate() + 1);
          return User.count({
            where: {
              createdAt: {
                [Op.gte]: day,
                [Op.lt]: nextDay
              }
            }
          });
        })
      );

      const dailyTransactions = await Promise.all(
        days.map(async (day) => {
          const nextDay = new Date(day);
          nextDay.setDate(day.getDate() + 1);
          return Transaction.count({
            where: {
              createdAt: {
                [Op.gte]: day,
                [Op.lt]: nextDay
              }
            }
          });
        })
      );

      return res.json({
        userCount,
        walletCount,
        transactionCount,
        activeWalletCount,
        openTicketCount,
        pendingTransactionsCount,
        weeklyGrowth,
        dailyTransactions
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAllWallets(req, res) {
    try {
      const wallets = await Wallet.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: WalletType,
            attributes: ['id', 'code', 'name', 'provider', 'imageUrl']
          },
          {
            model: User,
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      return res.json(wallets);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAllTransactions(req, res) {
    try {
      const transactions = await Transaction.findAll({
        order: [['createdAt', 'DESC']]
      });

      const walletCodes = [...new Set(transactions.map((tx) => tx.walletCode))];
      const detailedWallets = await Wallet.findAll({
        where: { walletCode: { [Op.in]: walletCodes } },
        include: [
          {
            model: WalletType,
            attributes: ['code', 'name', 'provider', 'imageUrl']
          },
          {
            model: User,
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      const walletMap = detailedWallets.reduce((acc, wallet) => {
        acc[wallet.walletCode] = {
          walletTypeCode: wallet.WalletType?.code,
          walletTypeName: wallet.WalletType?.name,
          walletTypeProvider: wallet.WalletType?.provider,
          walletTypeImageUrl: wallet.WalletType?.imageUrl,
          user: wallet.User ? {
            id: wallet.User.id,
            name: wallet.User.name,
            email: wallet.User.email
          } : null
        };
        return acc;
      }, {});

      const enrichedTransactions = transactions.map((transaction) => ({
        ...transaction.toJSON(),
        walletInfo: walletMap[transaction.walletCode] || null
      }));

      return res.json(enrichedTransactions);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAllTickets(req, res) {
    try {
      const tickets = await Ticket.findAll({
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      return res.json(tickets);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getTicketMessages(req, res) {
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

  async getUserWallets(req, res) {
    try {
      const userId = Number(req.params.id);

      const wallets = await Wallet.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: WalletType,
            attributes: ['id', 'code', 'name', 'provider', 'imageUrl']
          }
        ]
      });

      return res.json(wallets);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getUserTransactions(req, res) {
    try {
      const userId = Number(req.params.id);
      const wallets = await Wallet.findAll({
        where: { userId },
        attributes: ['walletCode']
      });

      const walletCodes = wallets.map((wallet) => wallet.walletCode);

      if (walletCodes.length === 0) {
        return res.json([]);
      }

      const transactions = await Transaction.findAll({
        where: { walletCode: { [Op.in]: walletCodes } },
        order: [['createdAt', 'DESC']]
      });

      const detailedWallets = await Wallet.findAll({
        where: { walletCode: walletCodes },
        include: [
          {
            model: WalletType,
            attributes: ['code', 'name', 'provider', 'imageUrl']
          },
          {
            model: User,
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      const walletMap = detailedWallets.reduce((acc, wallet) => {
        acc[wallet.walletCode] = {
          walletTypeCode: wallet.WalletType?.code,
          walletTypeName: wallet.WalletType?.name,
          walletTypeProvider: wallet.WalletType?.provider,
          walletTypeImageUrl: wallet.WalletType?.imageUrl,
          user: wallet.User ? {
            id: wallet.User.id,
            name: wallet.User.name,
            email: wallet.User.email
          } : null
        };
        return acc;
      }, {});

      const enrichedTransactions = transactions.map((transaction) => ({
        ...transaction.toJSON(),
        walletInfo: walletMap[transaction.walletCode] || null
      }));

      return res.json(enrichedTransactions);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();
