const test = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const { Wallet, Transaction } = require('../models');
const controller = require('../controllers/AdminController');

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
