const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('crypto');
const models = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('../services/PaymentService');
const SubscriptionController = require('../controllers/SubscriptionController');

function row(data) {
  return {
    ...data,
    async update(values) {
      Object.assign(this, values);
      return this;
    }
  };
}

function setup(t, { isFree = false, responseCode = 'INS-0' } = {}) {
  const pack = { id: 1, name: 'Standard', active: true, isFree, price: '100.00' };
  const subscriptions = [];
  const payments = [];
  const transactions = [];
  const subscription = row({
    id: randomUUID(), userId: 7, packageId: 1, status: 'expired',
    pricePaid: 100, expiresAt: new Date('2020-01-01'), paymentReference: null
  });
  t.mock.method(models.Package, 'findByPk', async () => pack);
  t.mock.method(models.Subscription, 'findOne', async ({ where }) =>
    where.userId === subscription.userId ? subscription : null);
  t.mock.method(models.Subscription, 'create', async (values) => {
    const created = row({ id: randomUUID(), ...values });
    subscriptions.push(created);
    return created;
  });
  t.mock.method(sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(models.Transaction, 'findOne', async ({ where }) =>
    transactions.find((tx) => tx.reference === where.reference) || null);
  t.mock.method(models.Transaction, 'create', async (values) => {
    const tx = row({ id: randomUUID(), ...values });
    transactions.push(tx);
    return tx;
  });
  t.mock.method(models.Transaction, 'findByPk', async (id) => transactions.find((tx) => tx.id === id));
  t.mock.method(models.AuditLog, 'create', async () => ({}));
  t.mock.method(PaymentService, 'createC2B', async (input) => {
    payments.push(input);
    return {
      output_ResponseCode: responseCode,
      output_ThirdPartyReference: input.thirdPartyReference,
      output_TransactionID: 'TESTTX',
      output_ResponseDesc: responseCode === 'INS-0' ? 'Confirmed' : 'Rejected'
    };
  });
  const wallet = t.mock.method(models.Wallet, 'findOne', async () => {
    throw new Error('Subscription payment must not use a wallet');
  });
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  const req = { user: { userId: 7 }, body: { packageId: 1, autoRenew: true, paymentMethod: 'mpesa', paymentNumber: '841234567' } };
  return { req, res, subscriptions, subscription, payments, transactions, wallet };
}

test('subscribe uses a 20-character SUB reference and links the transaction UUID', async (t) => {
  const state = setup(t);
  await SubscriptionController.subscribe(state.req, state.res);
  assert.equal(state.res.statusCode, 200);
  assert.equal(state.res.body.status, 'active');
  assert.match(state.payments[0].reference, /^SUB[A-Z0-9]{17}$/);
  assert.equal(state.payments[0].phone, '258841234567');
  assert.equal(state.transactions[0].reference, state.payments[0].reference);
  assert.equal(state.res.body.paymentReference, state.transactions[0].id);
  assert.equal(state.payments[0].thirdPartyReference, state.transactions[0].id.replace(/-/g, '').toUpperCase());
  assert.equal(state.wallet.mock.callCount(), 0);
});

test('renew uses a 20-character SUBRENEW reference and keeps the payment UUID link', async (t) => {
  const state = setup(t);
  state.req.body.id = state.subscription.id;
  await SubscriptionController.renew(state.req, state.res);
  assert.equal(state.res.statusCode, 200);
  assert.equal(state.subscription.status, 'active');
  assert.match(state.payments[0].reference, /^SUBRENEW[A-Z0-9]{12}$/);
  assert.equal(state.subscription.paymentReference, state.transactions[0].id);
  assert.equal(state.subscription.pricePaid, 200);
  assert.equal(state.wallet.mock.callCount(), 0);
});

test('free activation and renewal never send a payment', async (t) => {
  const state = setup(t, { isFree: true });
  await SubscriptionController.subscribe(state.req, state.res);
  assert.equal(state.res.body.paymentReference, null);
  assert.equal(state.res.body.pricePaid, 0);
  state.req.body.id = state.subscription.id;
  await SubscriptionController.renew(state.req, state.res);
  assert.equal(state.payments.length, 0);
});

test('rejected subscription payment does not activate a subscription', async (t) => {
  const state = setup(t, { responseCode: 'INS-6' });
  await SubscriptionController.subscribe(state.req, state.res);
  assert.equal(state.res.statusCode, 400);
  assert.equal(state.subscriptions.length, 0);
  assert.equal(state.transactions[0].status, 'failed');
});

test('rejected renewal keeps the subscription and original payment link unchanged', async (t) => {
  const state = setup(t, { responseCode: 'INS-6' });
  state.req.body.id = state.subscription.id;
  state.subscription.paymentReference = 'previous-transaction-id';
  const oldExpiry = state.subscription.expiresAt;
  await SubscriptionController.renew(state.req, state.res);
  assert.equal(state.res.statusCode, 400);
  assert.equal(state.subscription.status, 'expired');
  assert.equal(state.subscription.paymentReference, 'previous-transaction-id');
  assert.equal(state.subscription.expiresAt, oldExpiry);
  assert.equal(state.subscription.pricePaid, 100);
});

test('uncertain payment does not activate or renew a subscription', async (t) => {
  const state = setup(t, { responseCode: 'INS-9' });
  await SubscriptionController.subscribe(state.req, state.res);
  assert.equal(state.res.statusCode, 409);
  assert.equal(state.subscriptions.length, 0);
  state.req.body.id = state.subscription.id;
  await SubscriptionController.renew(state.req, state.res);
  assert.equal(state.res.statusCode, 409);
  assert.equal(state.subscription.status, 'expired');
  assert.equal(state.subscription.paymentReference, null);
  assert.equal(state.subscription.pricePaid, 100);
  assert.ok(state.transactions.every((tx) => tx.status === 'pending'));
});
