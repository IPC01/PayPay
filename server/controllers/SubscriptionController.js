const { Op } = require('sequelize');
const { Subscription, Package, Transaction, User } = require('../models');
const PaymentController = require('./PaymentController');

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
        include: [{ model: Package }, { model: Transaction, as: 'PaymentTransaction' }],
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
        include: [{ model: Package }, { model: User }, { model: Transaction, as: 'PaymentTransaction' }],
        order: [['createdAt', 'DESC']]
      });
      return res.json(subscriptions);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Encaminha o pagamento da subscri\u00e7\u00e3o para a rota de pagamento direto na API
  // principal (POST /api/payments/direct), sem apontar para nenhuma carteira
  async _processSubscriptionPayment({ price, paymentMethod, paymentNumber, reference }) {
    const { transaction } = await PaymentController.processDirectPayment({
      amount: price,
      phone: paymentNumber,
      reference,
      provider: paymentMethod,
      type: 'subscription'
    });
    return transaction;
  }

  async subscribe(req, res) {
    try {
      const userId = req.user.userId;
      const { packageId, autoRenew, paymentMethod, paymentNumber } = req.body;
      const pack = await Package.findByPk(packageId);
      if (!pack || !pack.active) {
        return res.status(404).json({ error: 'Package not found or inactive' });
      }

      const now = new Date();
      const price = pack.isFree
        ? 0
        : (pack.promoPrice && pack.promoStartDate && pack.promoEndDate && now >= pack.promoStartDate && now <= pack.promoEndDate
          ? parseFloat(pack.promoPrice)
          : parseFloat(pack.price));

      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const reference = `SUB-${Date.now()}-${userId}`;
      const transaction = pack.isFree
        ? null
        : await this._processSubscriptionPayment({
          price,
          paymentMethod,
          paymentNumber,
          reference
        });

      const subscription = await Subscription.create({
        userId,
        packageId,
        status: 'active',
        pricePaid: price,
        startedAt: now,
        expiresAt,
        autoRenew: Boolean(autoRenew),
        paymentReference: transaction?.id || null
      });

      return res.json(subscription);
    } catch (error) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  async renew(req, res) {
    try {
      const userId = req.user.userId;
      const { id, paymentMethod, paymentNumber } = req.body;
      const subscription = await Subscription.findOne({ where: { id, userId } });
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      const pack = await Package.findByPk(subscription.packageId);
      if (!pack || !pack.active) {
        return res.status(404).json({ error: 'Package not found or inactive' });
      }

      const now = new Date();
      const price = pack.isFree
        ? 0
        : (pack.promoPrice && pack.promoStartDate && pack.promoEndDate && now >= pack.promoStartDate && now <= pack.promoEndDate
          ? parseFloat(pack.promoPrice)
          : parseFloat(pack.price));

      const expiresAt = subscription.expiresAt && new Date(subscription.expiresAt) > now
        ? new Date(subscription.expiresAt)
        : now;
      expiresAt.setDate(expiresAt.getDate() + 30);

      const reference = `SUB-RENEW-${Date.now()}-${userId}`;
      const transaction = pack.isFree
        ? null
        : await this._processSubscriptionPayment({
          price,
          paymentMethod,
          paymentNumber,
          reference
        });

      await subscription.update({
        status: 'active',
        pricePaid: parseFloat(subscription.pricePaid || 0) + price,
        expiresAt,
        paymentReference: transaction?.id || subscription.paymentReference
      });

      return res.json(subscription);
    } catch (error) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
}

module.exports = new SubscriptionController();
