const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('crypto');
const axios = require('axios');
const models = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('../services/PaymentService');
const TransactionReversalService = require('../services/TransactionReversalService');
const MpesaAuth = require('../gateways/Mpesa/MpesaAuth');
const MpesaReversal = require('../gateways/Mpesa/MpesaReversal');

// Fictitious values: tests never use the real credentials from .env.
Object.assign(process.env, {
  MPESA_API_HOST: 'api.sandbox.vm.co.mz',
  MPESA_API_KEY: 'test-api-key',
  MPESA_PUBLIC_KEY: 'test-public-key',
  MPESA_SERVICE_PROVIDER_CODE: '171717',
  MPESA_ORIGIN: 'developer.mpesa.vm.co.mz',
  MPESA_REVERSAL_PORT: '18354',
  MPESA_INITIATOR_IDENTIFIER: 'test-initiator',
  MPESA_SECURITY_CREDENTIAL: 'test-credential'
});

function row(data) {
  return {
    ...data,
    async update(values) {
      Object.assign(this, values);
      return this;
    }
  };
}

function setup(t, { mode = 'C2B', balance = 1000, status = 'success', response, error } = {}) {
  const wallet = row({ id: 'wallet-id', userId: 7, walletCode: '000001', walletTypeId: 1, balance });
  const original = row({
    id: randomUUID(), paymentMode: mode, type: mode === 'B2C' ? 'withdrawal' : 'c2b', status,
    amount: 100, fee: mode === 'B2C' ? 10 : 0, phone: '258841234567', reference: 'PAYORIGINAL',
    providerTransactionId: 'MPESA-TX-1',
    toWalletId: mode === 'C2B' ? wallet.id : null,
    fromWalletId: mode === 'B2C' ? wallet.id : null
  });
  const transactions = [original];
  const ledger = [];
  const calls = [];
  t.mock.method(sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(models.Wallet, 'findByPk', async () => wallet);
  t.mock.method(models.WalletType, 'findByPk', async () => ({ referencePrefix: 'PAY' }));
  t.mock.method(models.Transaction, 'findByPk', async (id) => transactions.find((tx) => tx.id === id) || null);
  t.mock.method(models.Transaction, 'findOne', async ({ where }) => {
    if (where.reference) return transactions.find((tx) => tx.reference === where.reference) || null;
    const statuses = Object.getOwnPropertySymbols(where.status).map((key) => where.status[key])[0];
    return transactions.find((tx) =>
      tx.originalTransactionId === where.originalTransactionId && statuses.includes(tx.status)) || null;
  });
  t.mock.method(models.Transaction, 'create', async (data) => {
    const tx = row({ id: randomUUID(), ...data });
    transactions.push(tx);
    return tx;
  });
  t.mock.method(models.Ledger, 'create', async (data) => { ledger.push(data); });
  t.mock.method(models.AuditLog, 'create', async () => ({}));
  t.mock.method(models.Notification, 'create', async () => ({}));
  t.mock.method(PaymentService, 'reverse', async (input) => {
    calls.push({ input, balanceAtCall: wallet.balance });
    if (error) throw error;
    return response || {
      output_ResponseCode: 'INS-0', output_ResponseDesc: 'Request processed successfully',
      output_TransactionID: 'REV-TX', output_ThirdPartyReference: input.thirdPartyReference
    };
  });
  return { wallet, original, transactions, ledger, calls };
}

const request = (state, extra = {}) => ({ transactionId: state.original.id, userId: 7, ...extra });

test('reversal sends the documented fields with PUT on the reversal port (full reversal)', async (t) => {
  t.mock.method(MpesaAuth, 'getAccessToken', async () => 'token');
  const put = t.mock.method(axios, 'put', async (url, payload, config) => {
    assert.equal(url, 'https://api.sandbox.vm.co.mz:18354/ipg/v1x/reversal/');
    assert.equal(config.headers.Origin, 'developer.mpesa.vm.co.mz');
    assert.deepEqual(payload, {
      input_TransactionID: 'MPESA-TX-1',
      input_SecurityCredential: 'test-credential',
      input_InitiatorIdentifier: 'test-initiator',
      input_ThirdPartyReference: 'ABC123',
      input_ServiceProviderCode: '171717'
    });
    return { data: { output_ResponseCode: 'INS-0' } };
  });
  await MpesaReversal.execute({ transactionId: 'MPESA-TX-1', thirdPartyReference: 'ABC123', mode: 'live' });
  assert.equal(put.mock.callCount(), 1);
});

test('reversal is not sent when initiator credentials are missing from .env', async (t) => {
  const original = process.env.MPESA_SECURITY_CREDENTIAL;
  process.env.MPESA_SECURITY_CREDENTIAL = '';
  t.after(() => { process.env.MPESA_SECURITY_CREDENTIAL = original; });
  t.mock.method(MpesaAuth, 'getAccessToken', async () => 'token');
  const put = t.mock.method(axios, 'put', async () => ({ data: {} }));
  await assert.rejects(
    MpesaReversal.execute({ transactionId: 'X', thirdPartyReference: 'Y', mode: 'live' }),
    (e) => e.requestNotSent === true && /MPESA_SECURITY_CREDENTIAL/.test(e.message)
  );
  assert.equal(put.mock.callCount(), 0);
});

test('C2B reversal reserves the amount before M-Pesa and marks the original as reversed', async (t) => {
  const state = setup(t, { mode: 'C2B' });
  const result = await TransactionReversalService.execute(request(state));
  assert.equal(result.success, true);
  assert.equal(state.calls[0].balanceAtCall, 900);
  assert.equal(state.calls[0].input.transactionId, 'MPESA-TX-1');
  assert.match(state.calls[0].input.thirdPartyReference, /^[A-F0-9]{32}$/);
  assert.equal(state.wallet.balance, 900);
  assert.equal(state.original.status, 'reversed');
  assert.equal(result.transaction.type, 'reversal');
  assert.equal(result.transaction.originalTransactionId, state.original.id);
  assert.match(result.transaction.reference, /^PAY[A-Z0-9]{17}$/);
});

test('C2B reversal is blocked when the wallet balance is insufficient', async (t) => {
  const state = setup(t, { mode: 'C2B', balance: 50 });
  await assert.rejects(TransactionReversalService.execute(request(state)), /Saldo insuficiente/);
  assert.equal(state.calls.length, 0);
  assert.equal(state.wallet.balance, 50);
});

test('failed C2B reversal returns the reserved amount', async (t) => {
  const state = setup(t, { mode: 'C2B', response: { output_ResponseCode: 'INS-2001', output_ResponseDesc: 'Initiator authentication error' } });
  const result = await TransactionReversalService.execute(request(state));
  assert.equal(result.success, false);
  assert.equal(result.pending, false);
  assert.equal(state.wallet.balance, 1000);
  assert.equal(state.original.status, 'success');
});

test('B2C reversal credits only the withdrawn amount, not the fee', async (t) => {
  const state = setup(t, { mode: 'B2C' });
  const result = await TransactionReversalService.execute(request(state));
  assert.equal(result.success, true);
  assert.equal(state.calls[0].balanceAtCall, 1000);
  assert.equal(state.wallet.balance, 1100);
  assert.equal(state.ledger[0].type, 'credit');
  assert.equal(state.ledger[0].amount, 100);
});

test('uncertain reversal stays pending and keeps balances unchanged', async (t) => {
  const state = setup(t, { mode: 'B2C', error: Object.assign(new Error('timeout'), { requestNotSent: false }) });
  const result = await TransactionReversalService.execute(request(state));
  assert.equal(result.pending, true);
  assert.equal(state.wallet.balance, 1000);
  assert.equal(state.original.status, 'success');
});

test('a transaction cannot be reversed twice', async (t) => {
  const state = setup(t, { mode: 'B2C', error: Object.assign(new Error('timeout'), { requestNotSent: false }) });
  await TransactionReversalService.execute(request(state));
  await assert.rejects(TransactionReversalService.execute(request(state)), /já tem um estorno/);
  assert.equal(state.calls.length, 1);
});

test('only successful wallet transactions can be reversed', async (t) => {
  const state = setup(t, { status: 'failed' });
  await assert.rejects(TransactionReversalService.execute(request(state)), /concluídas com sucesso/);
  state.original.status = 'success';
  state.original.type = 'reversal';
  await assert.rejects(TransactionReversalService.execute(request(state)), /não pode ser estornado/);
  assert.equal(state.calls.length, 0);
});

test('clients can only reverse transactions of their own wallets; admins can reverse any', async (t) => {
  const state = setup(t, { mode: 'B2C' });
  await assert.rejects(TransactionReversalService.execute(request(state, { userId: 99 })), /não encontrada/);
  assert.equal(state.calls.length, 0);
  const result = await TransactionReversalService.execute(request(state, { userId: 99, isAdmin: true }));
  assert.equal(result.success, true);
});
