const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('crypto');
const models = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('../services/PaymentService');
const WalletPaymentService = require('../services/WalletPaymentService');
const { normalizeAmount, normalizePhone, generateReference } = require('../helpers/mpesaPayment');

function row(data) {
  return {
    ...data,
    async update(values) {
      Object.assign(this, values);
      return this;
    }
  };
}

function setup(t, { balance = 1000, response = { output_ResponseCode: 'INS-0', output_ResponseDesc: 'Confirmed',
  output_ConversationID: 'conversation', output_TransactionID: 'provider-tx' }, error, fee = 10, c2bFee = 0 } = {}) {
  const wallet = row({
    id: 'wallet-id', userId: 7, walletCode: '000001', walletTypeId: 1,
    status: 'ACTIVE', currency: 'MZN', balance, allowB2C: true, allowWithdraw: true, allowC2B: true
  });
  const transactions = [];
  const requests = [];
  const ledger = [];
  const calls = [];
  let queued = Promise.resolve();
  t.mock.method(sequelize, 'transaction', async (callback) => {
    const previous = queued;
    let release;
    queued = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await callback({ LOCK: { UPDATE: 'UPDATE' } });
    } finally {
      release();
    }
  });
  t.mock.method(models.Wallet, 'findOne', async ({ where, lock }) => {
    assert.equal(lock, 'UPDATE');
    return where.userId == null || where.userId === wallet.userId ? wallet : null;
  });
  t.mock.method(models.Wallet, 'findByPk', async () => wallet);
  t.mock.method(models.WalletType, 'findByPk', async () => ({
    id: 1, code: 'mpesa', status: true, referencePrefix: 'PAY'
  }));
  // As taxas são percentagens; com o valor 100 usado nos testes, a percentagem
  // coincide com o valor absoluto (10% de 100 = 10).
  t.mock.method(models.Setting, 'findOne', async () => ({
    withdrawalFeePercent: fee, c2bFeePercent: c2bFee, withdrawalMinValue: 20, withdrawalMaxValue: 500
  }));
  t.mock.method(models.Transaction, 'findOne', async ({ where }) =>
    transactions.find((tx) => tx.reference === where.reference) || null);
  t.mock.method(models.Transaction, 'create', async (data) => {
    const tx = row({ id: randomUUID(), ...data });
    transactions.push(tx);
    return tx;
  });
  t.mock.method(models.Transaction, 'findByPk', async (id) => transactions.find((tx) => tx.id === id));
  t.mock.method(models.WithdrawalRequest, 'create', async (data) => {
    const request = row({ id: randomUUID(), ...data });
    requests.push(request);
    return request;
  });
  t.mock.method(models.Ledger, 'create', async (data) => { ledger.push(data); });
  t.mock.method(models.AuditLog, 'create', async () => ({}));
  t.mock.method(models.Notification, 'create', async () => ({}));
  const gateway = async (input) => {
    calls.push(input);
    if (requests.length) assert.equal(ledger[0].type, 'debit');
    if (error) throw error;
    return response;
  };
  t.mock.method(PaymentService, 'createB2C', gateway);
  t.mock.method(PaymentService, 'createC2B', gateway);
  return { wallet, transactions, requests, ledger, calls };
}

const input = {
  walletId: 'wallet-id', userId: 7, amount: 100, phone: '841234567', paymentMode: 'B2C'
};

test('M-Pesa validates money and normalizes local and international MSISDN', () => {
  for (const phone of ['841234567', '0841234567', '+258 84 123 4567']) {
    assert.equal(normalizePhone(phone), '258841234567');
  }
  for (const phone of ['', '861234567', '25884123']) assert.throws(() => normalizePhone(phone));
  for (const amount of [0, -1, Infinity, '1oops', 0.001, true, [1], {}]) assert.throws(() => normalizeAmount(amount));
  assert.equal(normalizeAmount('100.25'), 100.25);
});

test('generated platform references are prefixed and distinct', () => {
  const references = new Set(Array.from({ length: 10000 }, () => generateReference('PAY')));
  assert.equal(references.size, 10000);
  for (const reference of references) assert.match(reference, /^PAY[A-Z0-9]{17}$/);
  assert.match(generateReference('my-long_prefix'), /^MYLONGPR[A-Z0-9]{12}$/);
  assert.match(generateReference(), /^[A-Z0-9]{20}$/);
});

test('B2C reserves amount plus platform fee and persists actual provider response', async (t) => {
  const state = setup(t);
  const result = await WalletPaymentService.execute(input);
  assert.equal(result.success, true);
  assert.equal(state.wallet.balance, 890);
  assert.equal(result.transaction.fee, 10);
  assert.equal(result.request.status, 'approved');
  assert.equal(result.transaction.providerTransactionId, 'provider-tx');
  assert.equal(result.transaction.fromWalletId, state.wallet.id);
  assert.equal(state.ledger.length, 1);
  assert.equal(state.ledger[0].amount, 110);
  assert.deepEqual(state.calls[0], {
    provider: 'mpesa', phone: '258841234567', amount: 100,
    reference: result.reference, thirdPartyReference: result.transactionId.replace(/-/g, '').toUpperCase(), mode: 'live'
  });
});

test('C2B credits the full amount and charges no fee', async (t) => {
  const state = setup(t, { fee: 100 });
  const result = await WalletPaymentService.execute({ ...input, paymentMode: 'C2B' });
  assert.equal(result.success, true);
  assert.equal(result.transaction.fee, 0);
  assert.equal(result.transaction.toWalletId, state.wallet.id);
  assert.equal(result.transaction.fromWalletId, null);
  assert.equal(state.wallet.balance, 1100);
  assert.equal(state.ledger[0].type, 'credit');
  assert.equal(state.ledger[0].amount, 100);
  assert.equal(state.requests.length, 0);
});

test('C2B retains the platform percentage fee and credits the net amount', async (t) => {
  const state = setup(t, { c2bFee: 10 });
  const result = await WalletPaymentService.execute({ ...input, paymentMode: 'C2B' });
  assert.equal(result.success, true);
  assert.equal(result.transaction.fee, 10);
  assert.equal(state.wallet.balance, 1090);
  assert.equal(state.ledger[0].type, 'credit');
  assert.equal(state.ledger[0].amount, 90);
  assert.equal(state.requests.length, 0);
});

test('confirmed B2C rejection refunds amount and platform fee', async (t) => {
  const state = setup(t, { response: { output_ResponseCode: 'INS-2051', output_ResponseDesc: 'MSISDN invalid' } });
  const result = await WalletPaymentService.execute(input);
  assert.equal(result.success, false);
  assert.equal(result.pending, false);
  assert.equal(result.request.status, 'rejected');
  assert.equal(state.wallet.balance, 1000);
  assert.deepEqual(state.ledger.map((entry) => [entry.type, entry.amount]), [['debit', 110], ['credit', 110]]);
});

test('B2C network timeout stays pending without retry or refund', async (t) => {
  const state = setup(t, { error: new Error('timeout') });
  const result = await WalletPaymentService.execute(input);
  assert.equal(result.pending, true);
  assert.equal(result.success, false);
  assert.equal(result.request.status, 'pending');
  assert.equal(result.request.processedAt, null);
  assert.equal(state.wallet.balance, 890);
  assert.equal(state.calls.length, 1);
  assert.equal(state.ledger.length, 1);
});

test('failure before dispatch releases the reservation', async (t) => {
  const state = setup(t, { error: Object.assign(new Error('Missing credentials'), { requestNotSent: true }) });
  const result = await WalletPaymentService.execute(input);
  assert.equal(result.transaction.status, 'failed');
  assert.equal(state.wallet.balance, 1000);
});

test('uncertain C2B response does not credit wallet', async (t) => {
  const state = setup(t, { response: { output_ResponseCode: 'INS-9', output_ResponseDesc: 'Timeout' } });
  const result = await WalletPaymentService.execute({ ...input, paymentMode: 'C2B' });
  assert.equal(result.pending, true);
  assert.equal(state.wallet.balance, 1000);
  assert.equal(state.ledger.length, 0);
});

test('mismatched third-party reference remains pending', async (t) => {
  const state = setup(t, { response: { output_ResponseCode: 'INS-0', output_ThirdPartyReference: 'different' } });
  const result = await WalletPaymentService.execute(input);
  assert.equal(result.pending, true);
  assert.equal(state.wallet.balance, 890);
});

test('B2C rejects balance below amount plus fee before sending', async (t) => {
  const state = setup(t, { balance: 109.99 });
  await assert.rejects(WalletPaymentService.execute(input), /Saldo insuficiente/);
  assert.equal(state.calls.length, 0);
  assert.equal(state.wallet.balance, 109.99);
});

test('B2C accepts exact amount plus fee balance', async (t) => {
  const state = setup(t, { balance: 110 });
  await WalletPaymentService.execute(input);
  assert.equal(state.wallet.balance, 0);
});

test('B2C enforces minimum, maximum and wallet permissions', async (t) => {
  const state = setup(t);
  await assert.rejects(WalletPaymentService.execute({ ...input, amount: 19.99 }), /mínimo/);
  await assert.rejects(WalletPaymentService.execute({ ...input, amount: 500.01 }), /máximo/);
  state.wallet.allowWithdraw = false;
  await assert.rejects(WalletPaymentService.execute(input), /not authorized/);
  assert.equal(state.calls.length, 0);
});

test('concurrent B2C requests cannot spend the same available balance', async (t) => {
  const state = setup(t, { balance: 110 });
  const results = await Promise.allSettled([
    WalletPaymentService.execute(input),
    WalletPaymentService.execute(input)
  ]);
  assert.equal(results.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(state.calls.length, 1);
  assert.equal(state.wallet.balance, 0);
});

test('repeated initial reference generates a new unique reference', async (t) => {
  const state = setup(t);
  const first = await WalletPaymentService.execute({ ...input, reference: 'ORDER1' });
  const second = await WalletPaymentService.execute({ ...input, reference: 'ORDER1' });
  assert.equal(state.calls.length, 2);
  assert.notEqual(first.reference, second.reference);
  // Base inicial (até 8 caracteres) + sufixo aleatório até 20 caracteres no total
  assert.match(first.reference, /^ORDER1[A-Z0-9]{14}$/);
  assert.match(second.reference, /^ORDER1[A-Z0-9]{14}$/);
});

test('initial references are sanitized and empty ones refused before any payment', async (t) => {
  const state = setup(t);
  // Caracteres inválidos são removidos e a base é limitada a 8 caracteres
  const result = await WalletPaymentService.execute({ ...input, reference: 'order-123-xyz' });
  assert.match(result.reference, /^ORDER123[A-Z0-9]{12}$/);
  // Uma referência sem qualquer carácter alfanumérico é recusada
  await assert.rejects(WalletPaymentService.execute({ ...input, reference: '---' }), /1 a 8 caracteres/);
  assert.equal(state.calls.length, 1);
});

test('zero percent fee and minimum/maximum boundaries are accepted', async (t) => {
  const state = setup(t, { fee: 0 });
  await WalletPaymentService.execute({ ...input, amount: 20 });
  await WalletPaymentService.execute({ ...input, amount: 500 });
  assert.equal(state.wallet.balance, 480);
  assert.equal(state.transactions[0].fee, 0);
  assert.equal(state.transactions[1].fee, 0);
});

test('wallet ownership and currency are validated before dispatch', async (t) => {
  const state = setup(t);
  await assert.rejects(WalletPaymentService.execute({ ...input, userId: 99 }), /Wallet not found/);
  state.wallet.currency = 'USD';
  await assert.rejects(WalletPaymentService.execute(input), /MZN/);
  assert.equal(state.calls.length, 0);
});

test('direct subscription payment uses C2B and never changes a client balance', async (t) => {
  const state = setup(t);
  const result = await WalletPaymentService.execute({
    userId: 7, amount: 100, phone: '841234567', paymentMode: 'C2B', type: 'subscription'
  });
  assert.equal(result.success, true);
  assert.equal(result.transaction.type, 'subscription');
  assert.equal(result.transaction.fee, 0);
  assert.equal(result.transaction.fromWalletId, null);
  assert.equal(result.transaction.toWalletId, null);
  assert.equal(state.ledger.length, 0);
  assert.equal(state.wallet.balance, 1000);
});

test('local persistence failure after provider call is reported pending, without sending again', async (t) => {
  const state = setup(t);
  t.mock.method(models.Transaction, 'findByPk', async () => { throw new Error('Database unavailable'); });
  const result = await WalletPaymentService.execute(input);
  assert.equal(result.success, false);
  assert.equal(result.pending, true);
  assert.match(result.message, /reconciliação/);
  assert.equal(state.wallet.balance, 890);
  assert.equal(state.calls.length, 1);
  assert.equal(state.requests[0].status, 'pending');
});
