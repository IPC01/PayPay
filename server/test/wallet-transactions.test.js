const test = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const { Wallet, Transaction } = require('../models');
const controller = require('../controllers/AdminController');
const clientController = require('../controllers/TransactionController');

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('wallet history selects every association and status, newest first, without duplicates', async (t) => {
  const wallet = { id: 'selected', walletCode: '000001', WalletType: { name: 'M-Pesa' }, User: { id: 2, name: 'Cliente' } };
  t.mock.method(Wallet, 'findByPk', async (id) => {
    assert.equal(id, 'selected');
    return wallet;
  });
  const fixtures = [
    { id: 'credit', toWalletId: 'selected', status: 'success' },
    { id: 'debit', fromWalletId: 'selected', status: 'pending' },
    { id: 'legacy', walletCode: '000001', status: 'failed' },
    { id: 'reversal', fromWalletId: 'selected', walletCode: '000001', status: 'reversed' },
    { id: 'unrelated', fromWalletId: 'other', toWalletId: 'other', walletCode: '999999', status: 'success' }
  ];
  t.mock.method(Transaction, 'findAll', async (options) => {
    assert.deepEqual(options.order, [['createdAt', 'DESC']]);
    assert.deepEqual(Reflect.ownKeys(options.where), [Op.or]);
    const conditions = options.where[Op.or];
    assert.deepEqual(conditions, [{ fromWalletId: 'selected' }, { toWalletId: 'selected' }, { walletCode: '000001' }]);
    return fixtures.filter((tx) => conditions.some((condition) => Object.entries(condition).every(([key, value]) => tx[key] === value)))
      .map((tx) => ({ toJSON: () => tx }));
  });
  const res = response();
  await controller.getWalletTransactions({ params: { id: 'selected' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map((tx) => tx.id), ['credit', 'debit', 'legacy', 'reversal']);
  assert.equal(res.body[0].walletInfo.user.name, 'Cliente');
  assert.equal(res.body[0].walletInfo.walletTypeName, 'M-Pesa');
});

test('wallet without a code never matches unrelated null-code transactions', async (t) => {
  t.mock.method(Wallet, 'findByPk', async () => ({ id: 'selected', walletCode: null }));
  t.mock.method(Transaction, 'findAll', async ({ where }) => {
    assert.deepEqual(where[Op.or], [{ fromWalletId: 'selected' }, { toWalletId: 'selected' }]);
    return [];
  });
  const res = response();
  await controller.getWalletTransactions({ params: { id: 'selected' } }, res);
  assert.deepEqual(res.body, []);
});

test('missing wallet returns 404 without querying transactions', async (t) => {
  t.mock.method(Wallet, 'findByPk', async () => null);
  const find = t.mock.method(Transaction, 'findAll', async () => []);
  const res = response();
  await controller.getWalletTransactions({ params: { id: 'missing' } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(find.mock.callCount(), 0);
});

test('history database failures return an explicit server error', async (t) => {
  t.mock.method(Wallet, 'findByPk', async () => ({ id: 'selected' }));
  t.mock.method(Transaction, 'findAll', async () => { throw new Error('Database unavailable'); });
  const res = response();
  await controller.getWalletTransactions({ params: { id: 'selected' } }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'Database unavailable');
});

test('client wallet history verifies ownership and includes incoming, outgoing and code-linked transactions in every status', async (t) => {
  t.mock.method(Wallet, 'findOne', async ({ where }) => {
    assert.deepEqual(where, { id: 'selected', userId: 2 });
    return { id: 'selected', walletCode: '000001', WalletType: { name: 'M-Pesa', code: 'MPESA' } };
  });
  const fixtures = [
    { id: 'credit', toWalletId: 'selected', status: 'success' },
    { id: 'debit', fromWalletId: 'selected', status: 'pending' },
    { id: 'legacy', walletCode: '000001', status: 'failed' },
    { id: 'reversal', fromWalletId: 'selected', walletCode: '000001', status: 'reversed' },
    { id: 'other', toWalletId: 'other', walletCode: '000002', status: 'success' }
  ];
  t.mock.method(Transaction, 'findAll', async ({ where, order }) => {
    assert.deepEqual(Reflect.ownKeys(where), [Op.or]);
    assert.deepEqual(where[Op.or], [{ fromWalletId: 'selected' }, { toWalletId: 'selected' }, { walletCode: '000001' }]);
    assert.deepEqual(order, [['createdAt', 'DESC']]);
    return fixtures.filter((tx) => where[Op.or].some((condition) => Object.entries(condition).every(([key, value]) => tx[key] === value)))
      .map((tx) => ({ toJSON: () => tx }));
  });
  const res = response();
  await clientController.getUserTransactions({ user: { userId: 2 }, query: { walletId: 'selected' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map((tx) => tx.id), ['credit', 'debit', 'legacy', 'reversal']);
  assert.equal(res.body[0].walletTypeName, 'M-Pesa');
});

test('client cannot fetch history from another user wallet or a missing wallet', async (t) => {
  t.mock.method(Wallet, 'findOne', async ({ where }) => {
    assert.equal(where.userId, 2);
    return null;
  });
  const find = t.mock.method(Transaction, 'findAll', async () => []);
  for (const walletId of ['other-user-wallet', 'missing']) {
    const res = response();
    await clientController.getUserTransactions({ user: { userId: 2 }, query: { walletId } }, res);
    assert.equal(res.statusCode, 404);
    assert.match(res.body.error, /Carteira/);
  }
  assert.equal(find.mock.callCount(), 0);
});

test('empty client wallet history does not match null wallet codes', async (t) => {
  t.mock.method(Wallet, 'findOne', async () => ({ id: 'selected', walletCode: null }));
  t.mock.method(Transaction, 'findAll', async ({ where }) => {
    assert.deepEqual(where[Op.or], [{ fromWalletId: 'selected' }, { toWalletId: 'selected' }]);
    return [];
  });
  const res = response();
  await clientController.getUserTransactions({ user: { userId: 2 }, query: { walletId: 'selected' } }, res);
  assert.deepEqual(res.body, []);
});
