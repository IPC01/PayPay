const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const models = require('../models');
const EmailService = require('../services/EmailService');
const AuthService = require('../services/AuthService');

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '0';
process.env.OTP_MAX_SENDS_PER_WINDOW = '1000';

function fakeTransport(t, outcomes) {
  const calls = [];
  t.mock.method(EmailService, 'getTransporter', () => ({
    sendMail: async (message) => {
      calls.push(message);
      const outcome = outcomes[Math.min(calls.length - 1, outcomes.length - 1)];
      if (outcome instanceof Error) throw outcome;
      return { messageId: `<id-${calls.length}>`, accepted: [message.to], rejected: [], ...outcome };
    },
    close() {}
  }));
  t.mock.method(EmailService, 'sleep', async () => {});
  t.mock.method(console, 'info', () => {});
  t.mock.method(console, 'error', () => {});
  return calls;
}

function smtpError(code, responseCode) {
  const err = new Error(`smtp ${code || responseCode}`);
  if (code) err.code = code;
  if (responseCode) err.responseCode = responseCode;
  return err;
}

test('sendMail retries transient SMTP failures', async (t) => {
  const calls = fakeTransport(t, [smtpError('ETIMEDOUT'), smtpError(null, 421), {}]);
  const info = await EmailService.sendMail({ to: 'ana@example.test', subject: 's', text: 't' });
  assert.equal(calls.length, 3);
  assert.equal(info.messageId, '<id-3>');
});

test('sendMail does not retry permanent failures and reports a clear error', async (t) => {
  const calls = fakeTransport(t, [smtpError('EAUTH', 535)]);
  await assert.rejects(
    EmailService.sendMail({ to: 'ana@example.test', subject: 's', text: 't' }),
    (err) => err.code === 'EMAIL_SEND_FAILED' && err.status === 503
  );
  assert.equal(calls.length, 1);
});

test('sendMail fails when the recipient is rejected', async (t) => {
  fakeTransport(t, [{ accepted: [], rejected: ['ana@example.test'], response: '550 no such user' }]);
  await assert.rejects(
    EmailService.sendMail({ to: 'ana@example.test', subject: 's', text: 't' }),
    { code: 'EMAIL_SEND_FAILED' }
  );
});

test('a failed email does not leave a usable challenge', async (t) => {
  const passwordHash = await bcrypt.hash('secret123', 4);
  const user = { id: 31, name: 'Eva', email: 'eva@example.test', roleId: 2, passwordHash };
  t.mock.method(models.User, 'findOne', async () => user);
  const sent = [];
  let fail = true;
  t.mock.method(EmailService, 'sendTwoFactorCode', async (message) => {
    sent.push(message);
    if (fail) throw new EmailService.EmailSendError('Nao foi possivel enviar o email.');
  });

  await assert.rejects(AuthService.verifyCredentials(user.email, 'secret123'), { status: 503 });

  fail = false;
  const challenge = await AuthService.verifyCredentials(user.email, 'secret123');
  // O código do envio falhado não pode ser usado
  if (sent[0].code !== sent[1].code) {
    await assert.rejects(AuthService.login(user.email, 'secret123', challenge.otpToken, sent[0].code), /invalido/);
  }
  const result = await AuthService.login(user.email, 'secret123', challenge.otpToken, sent[1].code);
  assert.ok(result.token);
});

test('a code from an earlier email still works after resending', async (t) => {
  const passwordHash = await bcrypt.hash('secret123', 4);
  const user = { id: 32, name: 'Rita', email: 'rita@example.test', roleId: 2, passwordHash };
  t.mock.method(models.User, 'findOne', async () => user);
  const sent = [];
  t.mock.method(EmailService, 'sendTwoFactorCode', async (message) => { sent.push(message); });

  await AuthService.verifyCredentials(user.email, 'secret123');
  const resent = await AuthService.verifyCredentials(user.email, 'secret123');

  const result = await AuthService.login(user.email, 'secret123', resent.otpToken, sent[0].code);
  assert.ok(result.token);

  // Após um login bem sucedido todos os códigos pendentes ficam inválidos
  await assert.rejects(AuthService.login(user.email, 'secret123', resent.otpToken, sent[1].code), /invalido/);
});

test('codes of another user are not accepted', async (t) => {
  const passwordHash = await bcrypt.hash('secret123', 4);
  const users = {
    'a@example.test': { id: 41, name: 'A', email: 'a@example.test', roleId: 2, passwordHash },
    'b@example.test': { id: 42, name: 'B', email: 'b@example.test', roleId: 2, passwordHash }
  };
  t.mock.method(models.User, 'findOne', async ({ where }) => users[where.email]);
  const sent = [];
  t.mock.method(EmailService, 'sendTwoFactorCode', async (message) => { sent.push(message); });

  const a = await AuthService.verifyCredentials('a@example.test', 'secret123');
  await AuthService.verifyCredentials('b@example.test', 'secret123');
  if (sent[0].code !== sent[1].code) {
    await assert.rejects(AuthService.login('a@example.test', 'secret123', a.otpToken, sent[1].code), /invalido/);
  }
});

test('verification emails have a descriptive subject and escaped HTML', async (t) => {
  const calls = fakeTransport(t, [{}]);
  await EmailService.sendTwoFactorCode({ to: 'ana@example.test', name: '<b>Ana</b>', code: '123456' });
  await EmailService.sendTwoFactorCode({ to: 'ana@example.test', name: 'Ana', code: '654321', purpose: 'registration' });
  await EmailService.sendPasswordReset({ to: 'ana@example.test', name: 'Ana', resetUrl: 'https://x.test/r?t=1' });

  assert.match(calls[0].subject, /123456 é o seu código de acesso/);
  assert.match(calls[1].subject, /654321 é o seu código para confirmar o email/);
  assert.match(calls[2].subject, /Redefinição da sua senha/);
  for (const call of calls) {
    assert.ok(call.subject.trim().length > 10);
    assert.ok(call.text && call.html.startsWith('<!DOCTYPE html>'));
    assert.ok(call.headers['X-Entity-Ref-ID']);
  }
  assert.ok(!calls[0].html.includes('<b>Ana</b>'));
  assert.ok(calls[0].html.includes('&lt;b&gt;Ana&lt;/b&gt;'));
  // Sem texto oculto (sinal de spam)
  assert.ok(!calls[0].html.includes('display:none'));
});

test('verification codes are rate limited per recipient', async (t) => {
  const passwordHash = await bcrypt.hash('secret123', 4);
  const user = { id: 51, name: 'Lia', email: 'lia@example.test', roleId: 2, passwordHash };
  t.mock.method(models.User, 'findOne', async () => user);
  const sent = [];
  let fail = false;
  t.mock.method(EmailService, 'sendTwoFactorCode', async (message) => {
    if (fail) throw new EmailService.EmailSendError('Nao foi possivel enviar o email.');
    sent.push(message);
  });
  t.after(() => {
    process.env.OTP_RESEND_COOLDOWN_SECONDS = '0';
    process.env.OTP_MAX_SENDS_PER_WINDOW = '1000';
  });

  process.env.OTP_RESEND_COOLDOWN_SECONDS = '30';
  fail = true;
  await assert.rejects(AuthService.verifyCredentials(user.email, 'secret123'), { status: 503 });
  fail = false;
  // Um envio falhado não ativa o cooldown
  const first = await AuthService.verifyCredentials(user.email, 'secret123');
  await assert.rejects(
    AuthService.verifyCredentials(user.email, 'secret123'),
    (err) => err.status === 429 && err.code === 'OTP_RATE_LIMITED' && err.retryAfter > 0
  );
  assert.equal(sent.length, 1);
  // O pedido bloqueado não invalida o código já enviado
  const result = await AuthService.login(user.email, 'secret123', first.otpToken, sent[0].code);
  assert.ok(result.token);

  process.env.OTP_RESEND_COOLDOWN_SECONDS = '0';
  process.env.OTP_MAX_SENDS_PER_WINDOW = '2';
  await AuthService.verifyCredentials(user.email, 'secret123');
  await assert.rejects(AuthService.verifyCredentials(user.email, 'secret123'), { status: 429 });
});
