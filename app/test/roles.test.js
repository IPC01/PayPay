import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessManagement, isOperator, isStaff, managementPath, postLoginRoute, roleLabel } from '../src/helpers/roles.js';

const admin = { roleId: 1, Role: { name: 'admin' } };
const client = { roleId: 2, Role: { name: 'user' } };
const operator = { roleId: 79, Role: { name: 'operator' } };

test('operator access is based on role name, not a hardcoded ID', () => {
  assert.equal(isOperator(operator), true);
  assert.equal(isStaff(operator), true);
  assert.equal(roleLabel(operator), 'Operador');
  for (const path of ['/operador', '/operador/users', '/operador/wallets', '/operador/transactions', '/operador/tickets', '/operador/kyc', '/operador/subscriptions', '/operador/profile', '/operador/notifications']) {
    assert.equal(canAccessManagement(operator, path), true, path);
  }
  for (const path of ['/admin', '/admin/tickets', '/operador/settings', '/operador/packages', '/operador/wallet-types', '/operador/legal-pages', '/operador/withdrawals', '/client', '/operador-extra']) {
    assert.equal(canAccessManagement(operator, path), false, path);
  }
});

test('login routes preserve permitted destinations and reject restricted paths', () => {
  assert.equal(postLoginRoute(operator, '/client'), '/operador');
  assert.equal(postLoginRoute(operator, '/admin/tickets'), '/operador/tickets');
  assert.equal(postLoginRoute(operator, '/operador/tickets'), '/operador/tickets');
  assert.equal(postLoginRoute(operator, '/admin/settings'), '/operador');
  assert.equal(postLoginRoute(operator, '/operador/settings'), '/operador');
  assert.equal(postLoginRoute(operator), '/operador');
  assert.equal(postLoginRoute(admin, '/admin/settings'), '/admin/settings');
  assert.equal(postLoginRoute(admin, '/client'), '/admin');
  assert.equal(postLoginRoute(admin, '/login'), '/admin');
  assert.equal(postLoginRoute(admin, 'https://example.invalid'), '/admin');
  assert.equal(postLoginRoute(client, '/admin'), '/client');
  assert.equal(postLoginRoute(client, '/operador/tickets'), '/client');
  assert.equal(postLoginRoute(admin, '/operador/tickets'), '/admin');
  assert.equal(postLoginRoute(client, '/client/transactions'), '/client/transactions');
  assert.equal(canAccessManagement(client, '/admin/tickets'), false);
  assert.equal(isOperator({ Role: { name: 'support' } }), true);
  assert.equal(canAccessManagement({ roleId: 1, Role: { name: 'operator' } }, '/admin/settings'), false);
});

test('management links use the profile namespace without rewriting API endpoints', () => {
  assert.equal(managementPath(operator), '/operador');
  assert.equal(managementPath(operator, '/admin/profile'), '/operador/profile');
  assert.equal(managementPath(operator, '/admin/notifications'), '/operador/notifications');
  assert.equal(managementPath(operator, '/api/admin/transactions'), '/api/admin/transactions');
  assert.equal(managementPath(admin, '/admin/users'), '/admin/users');
  assert.equal(managementPath({ Role: { name: 'support' } }), '/operador');
  assert.equal(canAccessManagement(admin, '/operador'), false);
  assert.equal(canAccessManagement(client, '/operador'), false);
});
