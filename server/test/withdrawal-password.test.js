const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const models = require('../models');
const WalletPaymentService = require('../services/WalletPaymentService');

async function setup(t) {
  const secret = 'withdrawal-password-test-only';
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = secret;
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  const password = ' my-platform-password ';
  const user = { id: 7, roleId: 2, isActive: true, passwordHash: await bcrypt.hash(password, 4) };
  const state = { calls: [], walletLookups: 0, passwordLookupError: false };
  t.mock.method(models.User, 'findByPk', async (id, options) => {
    assert.equal(id, user.id);
    if (options.attributes.includes('passwordHash') && state.passwordLookupError) {
      throw new Error('Database unavailable');
    }
    return user;
  });
  t.mock.method(models.Wallet, 'findOne', async () => {
    state.walletLookups += 1;
    return { id: 'wallet-id', walletCode: '000001', userId: user.id, status: 'ACTIVE' };
  });
  t.mock.method(models.Kyc, 'findOne', async () => ({ status: 'APPROVED' }));
  t.mock.method(models.WithdrawalRequest, 'findAll', async () => []);
  t.mock.method(WalletPaymentService, 'execute', async (input) => {
    state.calls.push(input);
    return { success: true, reference: 'TEST-WITHDRAWAL' };
  });

  const app = express();
  app.use(express.json());
  app.use('/api/withdrawals', require('../routes/withdrawRoutes'));
  app.use('/api/payments', require('../routes/paymentsRoutes'));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => { server.closeAllConnections(); server.close(); });
  const token = jwt.sign({ userId: user.id, type: 'session' }, secret, { expiresIn: 900 });

  const request = async (path, body, { authenticated = true, method = 'POST' } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json() };
  };
  return { state, request, password, user };
}

for (const [path, wallet] of [
  ['/api/withdrawals', { walletId: 'wallet-id' }],
  ['/api/payments/b2c', { walletCode: '000001' }]
]) {
  test(`${path} requires the authenticated user's current password before a withdrawal`, async (t) => {
    const { state, request, password, user } = await setup(t);
    const body = { ...wallet, amount: 100, phone: '841234567' };

    const anonymous = await request(path, { ...body, password }, { authenticated: false });
    assert.equal(anonymous.status, 401);

    for (const invalid of [undefined, '', 123456, true, ['password'], { value: password }]) {
      const missing = await request(path, { ...body, password: invalid });
      assert.equal(missing.status, 400);
      assert.match(missing.body.error, /senha de acesso/i);
    }

    for (const wrongPassword of ['wrong-password', password.trim(), '123456']) {
      const wrong = await request(path, { ...body, password: wrongPassword, userId: 99 });
      assert.equal(wrong.status, 403);
      assert.match(wrong.body.error, /incorreta/);
    }
    assert.equal(state.calls.length, 0);
    assert.equal(state.walletLookups, 0);

    const valid = await request(path, { ...body, password, userId: 99 });
    assert.equal(valid.status, path === '/api/withdrawals' ? 201 : 200);
    assert.equal(state.calls.length, 1);
    assert.equal(state.calls[0].userId, user.id);
    assert.equal(state.calls[0].paymentMode, 'B2C');
    assert.equal(Object.hasOwn(state.calls[0], 'password'), false);

    user.passwordHash = await bcrypt.hash('new-password', 4);
    const oldPassword = await request(path, { ...body, password });
    assert.equal(oldPassword.status, 403);
    assert.equal(state.calls.length, 1);
    const newPassword = await request(path, { ...body, password: 'new-password' });
    assert.equal(newPassword.status, path === '/api/withdrawals' ? 201 : 200);
    assert.equal(state.calls.length, 2);

    state.passwordLookupError = true;
    t.mock.method(console, 'error', () => {});
    const unavailable = await request(path, { ...body, password: 'new-password' });
    assert.equal(unavailable.status, 500);
    assert.match(unavailable.body.error, /Não foi possível confirmar/);
    assert.equal(state.calls.length, 2);
  });
}

test('C2B and withdrawal history do not require password confirmation', async (t) => {
  const { request, state } = await setup(t);
  const history = await request('/api/withdrawals', undefined, { method: 'GET' });
  assert.equal(history.status, 200);
  assert.deepEqual(history.body, []);

  const c2b = await request('/api/payments/c2b', { walletCode: '000001', amount: 100, phone: '841234567' });
  assert.equal(c2b.status, 200);
  assert.equal(state.calls.length, 1);
  assert.equal(state.calls[0].paymentMode, 'C2B');
});
