const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const models = require('../models');
const EmailService = require('../services/EmailService');
const AuthService = require('../services/AuthService');
const authMiddleware = require('../middleware/authMiddleware');

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '0';
process.env.OTP_MAX_SENDS_PER_WINDOW = '1000';

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
  assert.equal(result.expiresIn, 1800);
  const claims = jwt.verify(result.token, process.env.JWT_SECRET);
  assert.equal(claims.type, 'session');
  assert.equal(claims.exp - claims.iat, 30 * 60);
  assert.equal(new Date(result.expiresAt).getTime(), claims.exp * 1000);
  assert.doesNotThrow(() => jwt.verify(result.token, process.env.JWT_SECRET, { clockTimestamp: claims.iat + 1799 }));
  assert.throws(
    () => jwt.verify(result.token, process.env.JWT_SECRET, { clockTimestamp: claims.iat + 1800 }),
    { name: 'TokenExpiredError' }
  );

  // O código é de uso único
  await assert.rejects(AuthService.login(user.email, 'secret123', challenge.otpToken, sent[0].code), /invalido/);
});

function runMiddleware(token) {
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let nextCalled = false;
  return authMiddleware(req, res, () => { nextCalled = true; }).then(() => ({ res, nextCalled }));
}

test('auth middleware accepts only valid session tokens', async (t) => {
  t.mock.method(models.User, 'findByPk', async () => ({ id: 7, roleId: 2, isActive: true, Role: { name: 'client' } }));

  const { token } = AuthService.createSessionToken({ id: 7, email: 'ana@example.test', roleId: 2 });
  const ok = await runMiddleware(token);
  assert.equal(ok.nextCalled, true);

  const otpToken = jwt.sign({ userId: 7, type: '2fa' }, process.env.JWT_SECRET, { expiresIn: 300 });
  const otp = await runMiddleware(otpToken);
  assert.equal(otp.nextCalled, false);
  assert.equal(otp.res.statusCode, 401);
  assert.equal(otp.res.body.code, 'INVALID_TOKEN');

  const expired = jwt.sign(
    { userId: 7, type: 'session', iat: Math.floor(Date.now() / 1000) - 1000 },
    process.env.JWT_SECRET,
    { expiresIn: 900 }
  );
  const late = await runMiddleware(expired);
  assert.equal(late.nextCalled, false);
  assert.equal(late.res.statusCode, 401);
  assert.equal(late.res.body.code, 'SESSION_EXPIRED');
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
  assert.equal(result.expiresIn, 1800);
  const claims = jwt.verify(result.token, process.env.JWT_SECRET);
  assert.equal(claims.exp - claims.iat, 30 * 60);
  assert.equal(created.length, 1);
});
