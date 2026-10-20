import test from 'node:test';
import assert from 'node:assert/strict';
import { canQueryTransactionStatus, transactionStatusNotification } from '../src/helpers/transactionStatus.js';

test('M-Pesa C2B and B2C transactions can be queried in every local status', () => {
  for (const status of ['pending', 'success', 'failed', 'reversed', 'processing']) {
    for (const paymentMode of ['C2B', 'B2C']) {
      assert.equal(canQueryTransactionStatus({ provider: 'mpesa', paymentMode, status }), true);
    }
  }
  assert.equal(canQueryTransactionStatus(null), false);
  assert.equal(canQueryTransactionStatus({ provider: 'emola', paymentMode: 'C2B' }), false);
  assert.equal(canQueryTransactionStatus({ provider: 'mpesa', paymentMode: 'transfer' }), false);
});

test('query notifications report the provider result rather than the preserved local status', () => {
  assert.equal(transactionStatusNotification({
    status: 'failed', providerStatus: 'Completed', response: { output_ResponseCode: 'INS-0' }
  }).type, 'success');
  assert.equal(transactionStatusNotification({
    status: 'success', providerStatus: 'Expired', response: { output_ResponseCode: 'INS-0' }
  }).type, 'error');
  assert.equal(transactionStatusNotification({
    status: 'reversed', providerStatus: 'N/A', response: { output_ResponseCode: 'INS-0' }
  }).type, 'warning');
  const rejected = transactionStatusNotification({
    status: 'success', response: { output_ResponseCode: 'INS-18', output_ResponseDesc: 'Invalid TransactionID Used' }
  });
  assert.equal(rejected.type, 'error');
  assert.equal(rejected.message, 'Invalid TransactionID Used');
});
