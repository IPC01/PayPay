const test = require('node:test');
const assert = require('node:assert/strict');
const models = require('../models');
const sequelize = require('../config/database');
const PaymentService = require('../services/PaymentService');
const TransactionStatusService = require('../services/TransactionStatusService');

function row(data) {
  return {
    ...data,
    async update(values) {
      Object.assign(this, values);
      return this;
    }
  };
}

function setup(t, { paymentMode = 'C2B', providerStatus = 'Completed', isReversal = false } = {}) {
  const wallet = row({ id: 'wallet-id', userId: 7, balance: paymentMode === 'B2C' ? 890 : 50 });
  const transaction = row({
    id: '01234567-89ab-cdef-0123-456789abcdef',
    provider: 'mpesa',
    paymentMode,
    type: isReversal ? 'reversal' : paymentMode === 'B2C' ? 'withdrawal' : 'c2b',
    status: 'pending',
    amount: 100,
    fee: paymentMode === 'B2C' ? 10 : 0,
    reference: 'PAY123',
    providerReference: 'conversation-id',
    providerTransactionId: 'provider-tx-id',
    toWalletId: paymentMode === 'C2B' && !isReversal || paymentMode === 'B2C' && isReversal ? wallet.id : null,
    fromWalletId: paymentMode === 'B2C' && !isReversal || paymentMode === 'C2B' && isReversal ? wallet.id : null,
    originalTransactionId: isReversal ? 'original-id' : null
  });
  const original = isReversal ? row({ id: 'original-id', status: 'success' }) : null;
  const transactions = original ? [transaction, original] : [transaction];
  const withdrawal = row({ status: 'pending' });
  const ledger = [];
  const requestPayloads = [];
  const thirdPartyReference = '0123456789ABCDEF0123456789ABCDEF';
  t.mock.method(sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(models.Transaction, 'findByPk', async (id) => transactions.find((entry) => entry.id === id) || null);
  t.mock.method(models.Wallet, 'findOne', async ({ where }) => where.userId === wallet.userId ? wallet : null);
  t.mock.method(models.Wallet, 'findByPk', async () => wallet);
  t.mock.method(models.Ledger, 'create', async (entry) => { ledger.push(entry); });
  t.mock.method(models.WithdrawalRequest, 'findOne', async () => withdrawal);
  t.mock.method(models.Notification, 'create', async () => ({}));
  t.mock.method(models.AuditLog, 'create', async () => ({}));
  const query = t.mock.method(PaymentService, 'queryStatus', async (input) => {
    requestPayloads.push(input);
    return {
      output_ResponseCode: 'INS-0',
      output_ResponseDesc: 'Request processed successfully',
      output_ResponseTransactionStatus: providerStatus,
      output_ThirdPartyReference: thirdPartyReference
    };
  });
  return { wallet, transaction, original, withdrawal, ledger, requestPayloads, query };
}

test('completed C2B status credits the wallet exactly once', async (t) => {
  const state = setup(t);
  const first = await TransactionStatusService.query({ transactionId: state.transaction.id, userId: 7 });
  const second = await TransactionStatusService.query({ transactionId: state.transaction.id, userId: 7 });

  assert.equal(first.status, 'success');
  assert.equal(second.status, 'success');
  assert.equal(state.wallet.balance, 150);
  assert.equal(state.ledger.length, 1);
  assert.equal(state.ledger[0].type, 'credit');
  assert.deepEqual(state.requestPayloads[0], {
    provider: 'mpesa',
    thirdPartyReference: '0123456789ABCDEF0123456789ABCDEF',
    queryReference: 'provider-tx-id',
    mode: 'live'
  });
});

test('cancelled B2C status refunds the reserved amount and rejects the withdrawal', async (t) => {
  const state = setup(t, { paymentMode: 'B2C', providerStatus: 'Cancelled' });
  const result = await TransactionStatusService.query({ transactionId: state.transaction.id, userId: 7 });

  assert.equal(result.status, 'failed');
  assert.equal(state.wallet.balance, 1000);
  assert.equal(state.ledger.length, 1);
  assert.equal(state.ledger[0].amount, 110);
  assert.equal(state.withdrawal.status, 'rejected');
});

test('unknown provider status leaves transaction pending and does not change balance', async (t) => {
  const state = setup(t, { providerStatus: 'N/A' });
  const result = await TransactionStatusService.query({ transactionId: state.transaction.id, userId: 7 });

  assert.equal(result.pending, true);
  assert.equal(state.transaction.status, 'pending');
  assert.equal(state.wallet.balance, 50);
  assert.equal(state.ledger.length, 0);
});

test('completed B2C reversal marks the original reversed and returns the withdrawn amount', async (t) => {
  const state = setup(t, { paymentMode: 'B2C', isReversal: true });
  const result = await TransactionStatusService.query({ transactionId: state.transaction.id, userId: 7 });

  assert.equal(result.status, 'success');
  assert.equal(state.transaction.status, 'success');
  assert.equal(state.original.status, 'reversed');
  assert.equal(state.wallet.balance, 990);
  assert.equal(state.ledger.length, 1);
  assert.equal(state.ledger[0].type, 'credit');
});

test('administrators can query a wallet transaction without being its owner', async (t) => {
  const state = setup(t);
  const result = await TransactionStatusService.query({
    transactionId: state.transaction.id,
    userId: 99,
    isAdmin: true
  });

  assert.equal(result.status, 'success');
  assert.equal(state.wallet.balance, 150);
});

test('owners and administrators can query final statuses without changing settled funds', async (t) => {
  for (const status of ['success', 'failed', 'reversed']) {
    for (const isAdmin of [false, true]) {
      await t.test(`${isAdmin ? 'admin' : 'owner'} queries ${status}`, async (t) => {
        const state = setup(t);
        state.transaction.status = status;
        const result = await TransactionStatusService.query({
          transactionId: state.transaction.id,
          userId: isAdmin ? 99 : 7,
          isAdmin
        });
        assert.equal(result.status, status);
        assert.equal(result.providerStatus, 'Completed');
        assert.equal(state.query.mock.callCount(), 1);
        assert.equal(state.wallet.balance, 50);
        assert.equal(state.ledger.length, 0);
      });
    }
  }
});
