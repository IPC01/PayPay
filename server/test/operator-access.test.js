const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const models = require('../models');
const AdminController = require('../controllers/AdminController');
const TransactionController = require('../controllers/TransactionController');
const KycController = require('../controllers/KycController');
const PackageController = require('../controllers/PackageController');
const SettingsController = require('../controllers/SettingsController');

function row(data) {
  return {
    ...data,
    async update(values) { Object.assign(this, values); return this; },
    async save() { return this; }
  };
}

async function setup(t) {
  const users = {
    1: row({ id: 1, roleId: 1, name: 'Admin', isActive: true, Role: { name: 'admin', Permissions: [{ name: 'admin:all' }] } }),
    2: row({ id: 2, roleId: 2, name: 'Cliente', isActive: true, Role: { name: 'user', Permissions: [] } }),
    3: row({ id: 3, roleId: 79, name: 'Operador', isActive: true, Role: { name: 'operator', Permissions: [] } })
  };
  const wallet = row({ id: 'wallet', userId: 2, status: 'ACTIVE', walletCode: '000001' });
  const ticket = row({ id: 'ticket', userId: 2, status: 'open', subject: 'Ajuda' });
  const messages = [];
  t.mock.method(models.User, 'findByPk', async (id) => users[id] || null);
  t.mock.method(models.User, 'findAll', async ({ include }) => {
    const roleFilter = include?.find((entry) => entry.model === models.Role)?.where?.name;
    return Object.values(users).filter((user) => !roleFilter || user.Role.name === roleFilter);
  });
  t.mock.method(models.User, 'findOne', async () => null);
  t.mock.method(models.User, 'create', async (data) => row({ id: 4, ...data }));
  t.mock.method(models.Role, 'findOne', async ({ where }) => ({ id: where.name === 'operator' ? 79 : where.name === 'admin' ? 1 : 2 }));
  t.mock.method(models.Role, 'findByPk', async (id) => ({ id, name: Number(id) === 1 ? 'admin' : 'user' }));
  t.mock.method(models.Wallet, 'findByPk', async () => wallet);
  t.mock.method(models.Wallet, 'findOne', async ({ where }) =>
    where.userId === undefined || where.userId === wallet.userId ? wallet : null);
  t.mock.method(models.Ticket, 'findByPk', async () => ticket);
  t.mock.method(models.TicketMessage, 'findAll', async () => messages);
  t.mock.method(models.TicketMessage, 'create', async (data) => { messages.push(data); return data; });
  t.mock.method(models.Notification, 'create', async () => ({}));
  t.mock.method(models.AuditLog, 'create', async () => ({}));
  for (const name of ['getStats', 'getAllWallets', 'getWalletTransactions', 'getAllTransactions', 'getAllTickets', 'getTicketMessages', 'getUserWallets', 'getUserTransactions', 'getSubscriptions', 'getSubscriptionStats']) {
    t.mock.method(AdminController, name, async (req, res) => res.json({ permitted: true }));
  }
  for (const name of ['getAdminKycs', 'getAdminKycById', 'reviewKyc']) {
    t.mock.method(KycController, name, async (req, res) => res.json({ permitted: true }));
  }
  t.mock.method(PackageController, 'save', async (req, res) => res.json({ permitted: true }));
  t.mock.method(SettingsController, 'saveSettings', async (req, res) => res.json({ permitted: true }));
  t.mock.method(TransactionController, 'reverse', async (req, res) => res.json({ permitted: true }));
  t.mock.method(TransactionController, 'queryStatus', async (req, res) =>
    res.json({ permitted: true, globalQuery: req.isAdminTransactionStatus === true }));

  const app = express();
  app.use(express.json());
  for (const [prefix, file] of [
    ['admin', 'adminRoutes'], ['users', 'userRoutes'], ['wallets', 'walletRoutes'],
    ['kyc', 'kycRoutes'], ['tickets', 'ticketRoutes'], ['wallet-types', 'walletTypeRoutes']
  ]) {
    const modulePath = require.resolve(`../routes/${file}`);
    delete require.cache[modulePath];
    app.use(`/api/${prefix}`, require(modulePath));
  }
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => { server.closeAllConnections(); server.close(); });
  const secret = 'operator-access-test-only';
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = secret;
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const request = async (userId, path, method = 'GET', body, claims = {}) => {
    const token = jwt.sign({ userId, roleId: users[userId]?.roleId, type: 'session', ...claims }, secret);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json() };
  };
  return { users, wallet, ticket, messages, request };
}

test('operator reads support pages and can review KYC/query any transaction without admin permission', async (t) => {
  const { request } = await setup(t);
  for (const path of ['/admin/stats', '/admin/wallets', '/admin/transactions', '/admin/tickets', '/admin/subscriptions', '/admin/subscription-stats', '/admin/users/2/wallets', '/admin/users/2/transactions', '/kyc/admin', '/kyc/admin/kyc']) {
    assert.equal((await request(3, path)).status, 200, path);
  }
  assert.equal((await request(3, '/kyc/admin/kyc/review', 'POST', { status: 'APPROVED' })).status, 200);
  const query = await request(3, '/admin/transactions/tx/status');
  assert.equal(query.status, 200);
  assert.equal(query.body.globalQuery, true);
});

test('wallet transaction history is accessible to staff but not clients', async (t) => {
  const { request } = await setup(t);
  const path = '/admin/wallets/wallet/transactions';
  assert.equal((await request(1, path)).status, 200);
  assert.equal((await request(3, path)).status, 200);
  assert.equal((await request(2, path)).status, 403);
});

test('operator cannot create users/packages/types, change settings, reverse or manage staff', async (t) => {
  const { request } = await setup(t);
  for (const [path, method, body] of [
    ['/users', 'POST', { name: 'A', email: 'a@test.invalid', password: 'test', roleName: 'admin' }],
    ['/admin/packages', 'POST', {}], ['/admin/packages/a', 'DELETE'],
    ['/wallet-types', 'POST', {}], ['/wallet-types/1', 'PUT', {}],
    ['/admin/settings', 'POST', {}], ['/admin/settings', 'GET'],
    ['/admin/legal-pages', 'GET'], ['/admin/withdrawals', 'GET'],
    ['/admin/transactions/tx/reverse', 'POST', {}],
    ['/users/1', 'GET'], ['/users/1', 'PUT', { isActive: false }],
    ['/users/2', 'DELETE'], ['/admin/users/1/wallets', 'GET'],
    ['/users/2', 'PUT', { name: 'Changed' }], ['/users/2', 'PUT', { roleId: 1, isActive: true }],
    ['/users/3', 'PUT', { roleId: 1 }]
  ]) assert.equal((await request(3, path, method, body)).status, 403, `${method} ${path}`);
});

test('operator list exposes clients only, and client block/unblock is enforced with existing tokens', async (t) => {
  const { users, request } = await setup(t);
  const listed = await request(3, '/users');
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body.map((user) => user.id), [2]);
  assert.equal((await request(3, '/users/2', 'PUT', { isActive: false })).status, 200);
  assert.equal(users[2].isActive, false);
  assert.equal((await request(2, '/users/2')).status, 403);
  assert.equal((await request(3, '/users/2', 'PUT', { isActive: true })).status, 200);
  assert.equal((await request(2, '/users/2')).status, 200);
  assert.equal((await request(3, '/users/2', 'PUT', { isActive: 'false' })).status, 400);
});

test('operator can freeze/unfreeze customer wallets but not close/reopen closed wallets or edit permissions', async (t) => {
  const { wallet, request } = await setup(t);
  assert.equal((await request(3, '/wallets/wallet/status', 'PUT', { status: 'FROZEN' })).status, 200);
  assert.equal(wallet.status, 'FROZEN');
  assert.equal((await request(3, '/wallets/wallet/status', 'PUT', { status: 'ACTIVE' })).status, 200);
  assert.equal((await request(3, '/wallets/wallet/status', 'PUT', { status: 'CLOSED' })).status, 403);
  assert.equal((await request(3, '/wallets/wallet/status', 'PUT', { status: 'FROZEN', allowB2C: true })).status, 403);
  assert.equal((await request(3, '/wallets/wallet', 'PUT', { allowB2C: true })).status, 404);
  wallet.userId = 1;
  assert.equal((await request(3, '/wallets/wallet/status', 'PUT', { status: 'FROZEN' })).status, 403);
  wallet.userId = 2;
  wallet.status = 'CLOSED';
  assert.equal((await request(3, '/wallets/wallet/status', 'PUT', { status: 'ACTIVE' })).status, 403);
});

test('operator replies as support, updates ticket state, but cannot delete customer tickets', async (t) => {
  const { ticket, messages, request } = await setup(t);
  assert.equal((await request(3, '/tickets/ticket/messages', 'POST', { message: 'Vamos ajudar.' })).status, 201);
  assert.equal(messages[0].senderType, 'admin');
  assert.equal(ticket.status, 'pending');
  assert.equal((await request(3, '/tickets/ticket/status', 'PATCH', { status: 'closed' })).status, 200);
  assert.equal(ticket.status, 'closed');
  assert.equal((await request(3, '/tickets/ticket/status', 'PATCH', { status: 'invalid' })).status, 400);
  assert.equal((await request(3, '/tickets/ticket', 'DELETE')).status, 403);
  assert.equal((await request(2, '/tickets/ticket/status', 'PATCH', { status: 'closed' })).status, 403);
});

test('client cannot enter staff routes, spoof staff claims, or elevate their own role', async (t) => {
  const { request } = await setup(t);
  for (const path of ['/admin/stats', '/users', '/admin/transactions', '/kyc/admin']) {
    assert.equal((await request(2, path, 'GET', undefined, { roleId: 1, roleName: 'admin' })).status, 403, path);
  }
  assert.equal((await request(2, '/users/2', 'PUT', { roleId: 1 })).status, 403);
});

test('administrator retains exclusive actions and can create the operator role', async (t) => {
  const { request } = await setup(t);
  for (const [path, method] of [['/admin/packages', 'POST'], ['/admin/settings', 'POST'], ['/admin/transactions/tx/reverse', 'POST']]) {
    assert.equal((await request(1, path, method, {})).status, 200);
  }
  const created = await request(1, '/users', 'POST', {
    name: 'Operador Novo', email: 'operator@test.invalid', password: 'TestOnly123', roleName: 'operator'
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.user.roleId, 79);
});

test('current database role overrides stale admin tokens and legacy support remains compatible', async (t) => {
  const { users, request } = await setup(t);
  users[3].Role.name = 'support';
  assert.equal((await request(3, '/admin/tickets')).status, 200);
  assert.equal((await request(3, '/admin/settings', 'GET', undefined, { roleId: 1, roleName: 'admin' })).status, 403);
  users[1].Role = { name: 'operator', Permissions: [{ name: 'admin:all' }] };
  assert.equal((await request(1, '/admin/settings')).status, 403);
});

test('inactive operators lose access immediately and database failures remain server errors', async (t) => {
  const { users, request } = await setup(t);
  users[3].isActive = false;
  assert.equal((await request(3, '/admin/tickets')).status, 403);
  t.mock.method(models.User, 'findByPk', async () => { throw new Error('Database unavailable'); });
  const result = await request(3, '/admin/tickets');
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'Database unavailable');
});

test('startup role migration preserves support account IDs and is idempotent', async (t) => {
  const roles = [row({ id: 1, name: 'admin' }), row({ id: 2, name: 'user' }), row({ id: 79, name: 'support' })];
  t.mock.method(models.Role, 'findOne', async ({ where }) => roles.find((role) => role.name === where.name));
  const create = t.mock.method(models.Role, 'create', async (data) => { roles.push(row({ id: 80, ...data })); });
  const seedRoles = require('../Seeders/rolesSeeder');
  await seedRoles();
  await seedRoles();
  assert.equal(roles.find((role) => role.name === 'operator').id, 79);
  assert.deepEqual(roles.map((role) => role.name), ['admin', 'user', 'operator']);
  assert.equal(create.mock.callCount(), 0);
});

test('startup creates only missing roles without duplicating existing operators', async (t) => {
  const roles = [row({ id: 79, name: 'operator' })];
  t.mock.method(models.Role, 'findOne', async ({ where }) => roles.find((role) => role.name === where.name));
  t.mock.method(models.Role, 'create', async (data) => { roles.push(row({ id: roles.length + 80, ...data })); });
  const seedRoles = require('../Seeders/rolesSeeder');
  await seedRoles();
  await seedRoles();
  assert.equal(roles.length, 3);
  assert.equal(roles.find((role) => role.name === 'operator').id, 79);
});
