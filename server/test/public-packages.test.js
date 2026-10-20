const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { Package } = require('../models');

async function setup(t) {
  const app = express();
  app.use(express.json());
  app.use('/api/packages', require('../routes/packageRoutes'));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => { server.closeAllConnections(); server.close(); });
  return `http://127.0.0.1:${server.address().port}/api/packages`;
}

test('anonymous visitors can read active plans with only public fields and server ordering', async (t) => {
  const packages = [{ id: 1, name: 'Plano do servidor', price: '250.00', isFree: false, description: 'Descrição do servidor', promoPrice: null, promoStartDate: null, promoEndDate: null }];
  t.mock.method(Package, 'findAll', async (options) => {
    assert.deepEqual(options.where, { active: true });
    assert.deepEqual(options.order, [['price', 'ASC']]);
    assert.deepEqual(options.attributes, ['id', 'name', 'price', 'isFree', 'description', 'promoPrice', 'promoStartDate', 'promoEndDate']);
    return packages;
  });
  const base = await setup(t);
  const result = await fetch(`${base}/public`);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), packages);
});

test('public plan catalog distinguishes empty results from database failures', async (t) => {
  const find = t.mock.method(Package, 'findAll', async () => []);
  const base = await setup(t);
  const empty = await fetch(`${base}/public`);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), []);
  find.mock.mockImplementation(async () => { throw new Error('Database unavailable'); });
  const failure = await fetch(`${base}/public`);
  assert.equal(failure.status, 500);
  assert.deepEqual(await failure.json(), { error: 'Database unavailable' });
});

test('existing package endpoints still require authentication', async (t) => {
  const base = await setup(t);
  for (const [path, method] of [['', 'GET'], ['/all', 'GET'], ['/1', 'GET'], ['', 'POST'], ['/1', 'DELETE']]) {
    const result = await fetch(`${base}${path}`, { method });
    assert.equal(result.status, 401, `${method} ${path}`);
  }
});
