const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const models = require('../models');
const EmailService = require('../services/EmailService');
const AuthService = require('../services/AuthService');

process.env.JWT_SECRET = 'test-jwt-secret';

function captureCodes(t) {
  const sent = [];
  t.mock.method(EmailService, 'sendTwoFactorCode', async (message) => {
    sent.push(message);
  });
  return sent;
}

test('login requires the code sent by email', async (t) => {
  const passwordHash = await bcrypt.hash('secret123', 4);
  const user = { id: 7, name: 'Ana', email: 'ana@example.test', roleId: 2, passwordHash };
  t.mock.method(models.User, 'findOne', async ({ where }) => (where.email === user.email ? user : null));
  const sent = captureCodes(t);

  await assert.rejects(AuthService.login(user.email, 'secret123'), /obrigatorio/);

  const challenge = await AuthService.verifyCredentials(user.email, 'secret123');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, user.email);
  assert.match(sent[0].code, /^\d{6}$/);

  const wrongCode = sent[0].code === '000000' ? '111111' : '000000';
  await assert.rejects(AuthService.login(user.email, 'secret123', challenge.otpToken, wrongCode), /invalido/);

  const result = await AuthService.login(user.email, 'secret123', challenge.otpToken, sent[0].code);
  assert.ok(result.token);
  assert.equal(result.userId, user.id);

  // O código é de uso único
  await assert.rejects(AuthService.login(user.email, 'secret123', challenge.otpToken, sent[0].code), /invalido/);
});

test('login does not send a code when the password is wrong', async (t) => {
  const passwordHash = await bcrypt.hash('secret123', 4);
  t.mock.method(models.User, 'findOne', async () => ({ id: 7, email: 'ana@example.test', passwordHash }));
  const sent = captureCodes(t);

  await assert.rejects(AuthService.verifyCredentials('ana@example.test', 'wrong'), /Invalid credentials/);
  assert.equal(sent.length, 0);
});

test('registration requires the code sent to the given email', async (t) => {
  t.mock.method(models.User, 'findOne', async () => null);
  t.mock.method(models.Role, 'findOne', async () => ({ id: 2 }));
  const created = [];
  t.mock.method(models.User, 'create', async (data) => {
    const user = { id: 9, ...data };
    created.push(user);
    return user;
  });
  const sent = captureCodes(t);

  const { otpToken } = await AuthService.requestRegistrationCode('Rui', 'rui@example.test');
  assert.equal(sent[0].to, 'rui@example.test');

  await assert.rejects(
    AuthService.register('Rui', 'other@example.test', 'secret123', otpToken, sent[0].code),
    /invalido/
  );
  assert.equal(created.length, 0);

  const result = await AuthService.register('Rui', 'rui@example.test', 'secret123', otpToken, sent[0].code);
  assert.ok(result.token);
  assert.equal(created.length, 1);
});
