const { Op } = require('sequelize');
const { Subscription, Package, Wallet, Ledger, Transaction } = require('../models');
const sequelize = require('../config/database');

class SubscriptionController {
  constructor() {
    this.expireOldSubscriptions = this.expireOldSubscriptions.bind(this);
    this.getUserSubscriptions = this.getUserSubscriptions.bind(this);
    this.getAllSubscriptions = this.getAllSubscriptions.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.renew = this.renew.bind(this);
  }

  async expireOldSubscriptions(filter = {}) {
    const now = new Date();
    const where = {
      ...filter,
      expiresAt: { [Op.lt]: now },
      status: 'active'
    };
    await Subscription.update({ status: 'expired' }, { where });
  }

  async getUserSubscriptions(req, res) {
    try {
      const userId = req.user.userId;
      await this.expireOldSubscriptions({ userId });
      const subscriptions = await Subscription.findAll({
        where: { userId },
        include: [{ model: Package }],
        order: [['createdAt', 'DESC']]
      });
      return res.json(subscriptions);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAllSubscriptions(req, res) {
    try {
      await this.expireOldSubscriptions();
      const subscriptions = await Subscription.findAll({
        include: [{ model: Package }, { model: require('../models').User }],
        order: [['createdAt', 'DESC']]
      });
      return res.json(subscriptions);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async subscribe(req, res) {
    try {
      const userId = req.user.userId;
      const { packageId, walletId, autoRenew, paymentMethod, paymentNumber } = req.body;
      const pack = await Package.findByPk(packageId);
      if (!pack || !pack.active) {
        return res.status(404).json({ error: 'Package not found or inactive' });
      }

      let wallet = null;
      if (walletId) {
        wallet = await Wallet.findOne({ where: { id: walletId, userId } });
        if (!wallet) {
          return res.status(404).json({ error: 'Wallet not found' });
        }
      }

      const now = new Date();
      const price = pack.promoPrice && pack.promoStartDate && pack.promoEndDate && now >= pack.promoStartDate && now <= pack.promoEndDate
        ? parseFloat(pack.promoPrice)
        : parseFloat(pack.price);

      if (wallet && parseFloat(wallet.balance || 0) < price) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const transaction = await sequelize.transaction(async (t) => {
        if (wallet) {
          wallet.balance = parseFloat(wallet.balance || 0) - price;
          await wallet.save({ transaction: t });
        }

        const tx = await Transaction.create({
          fromWalletId: wallet?.id || null,
          toWalletId: null,
          amount: price,
          fee: 0,
          type: 'subscription',
          paymentMode: 'subscription',
          phone: wallet?.walletCode || paymentNumber || null,
          walletCode: wallet?.walletCode || null,
          reference: `SUB-${Date.now()}${wallet?.walletCode ? `-${wallet.walletCode}` : ''}`,
          status: 'success',
          apiKeyId: null,
          provider: paymentMethod || 'platform'
        }, { transaction: t });

        if (wallet) {
          await Ledger.create({
            transactionId: tx.id,
            walletId: wallet.id,
            type: 'debit',
            amount: price,
            balanceBefore: parseFloat(wallet.balance || 0) + price,
            balanceAfter: parseFloat(wallet.balance || 0)
          }, { transaction: t });
        }

        return tx;
      });

      const subscription = await Subscription.create({
        userId,
        packageId,
        status: 'active',
        pricePaid: price,
        startedAt: now,
        expiresAt,
        autoRenew: Boolean(autoRenew),
        paymentReference: transaction.id
      });

      return res.json(subscription);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async renew(req, res) {
    try {
      const userId = req.user.userId;
      const { id, walletId } = req.body;
      const subscription = await Subscription.findOne({ where: { id, userId } });
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      const pack = await Package.findByPk(subscription.packageId);
      if (!pack || !pack.active) {
        return res.status(404).json({ error: 'Package not found or inactive' });
      }

      let wallet = null;
      if (walletId) {
        wallet = await Wallet.findOne({ where: { id: walletId, userId } });
        if (!wallet) {
          return res.status(404).json({ error: 'Wallet not found' });
        }
      }

      const now = new Date();
      const price = pack.promoPrice && pack.promoStartDate && pack.promoEndDate && now >= pack.promoStartDate && now <= pack.promoEndDate
        ? parseFloat(pack.promoPrice)
        : parseFloat(pack.price);

      if (wallet && parseFloat(wallet.balance || 0) < price) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      const expiresAt = subscription.expiresAt && new Date(subscription.expiresAt) > now
        ? new Date(subscription.expiresAt)
        : now;
      expiresAt.setDate(expiresAt.getDate() + 30);

      const transaction = await sequelize.transaction(async (t) => {
        if (wallet) {
          wallet.balance = parseFloat(wallet.balance || 0) - price;
          await wallet.save({ transaction: t });
        }

        const tx = await Transaction.create({
          fromWalletId: wallet?.id || null,
          toWalletId: null,
          amount: price,
          fee: 0,
          type: 'subscription',
          paymentMode: 'subscription',
          phone: wallet?.walletCode || null,
          walletCode: wallet?.walletCode || null,
          reference: `SUB-RENEW-${Date.now()}${wallet?.walletCode ? `-${wallet.walletCode}` : ''}`,
          status: 'success',
          apiKeyId: null,
          provider: 'platform'
        }, { transaction: t });

        if (wallet) {
          await Ledger.create({
            transactionId: tx.id,
            walletId: wallet.id,
            type: 'debit',
            amount: price,
            balanceBefore: parseFloat(wallet.balance || 0) + price,
            balanceAfter: parseFloat(wallet.balance || 0)
          }, { transaction: t });
        }

        return tx;
      });

      await subscription.update({
        status: 'active',
        pricePaid: parseFloat(subscription.pricePaid || 0) + price,
        expiresAt,
        paymentReference: transaction.id
      });

      return res.json(subscription);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SubscriptionController();
