const test = require('node:test');
const assert = require('node:assert/strict');

const axios = require('axios');

const mpesaRequestMode = require('../src/middleware/mpesaRequestMode');
const PaymentService = require('../src/services/PaymentService');
const MpesaClient = require('../src/gateways/Mpesa/MpesaClient');
const MpesaAuth = require('../src/gateways/Mpesa/MpesaAuth');

function createReq(headers = {}) {
  return { headers };
}

function createRes() {
  return {};
}

test('mpesaRequestMode resolves mock/live from route, header and env', async () => {
  const originalEnv = process.env.MPESA_MOCK_MODE;

  try {
    process.env.MPESA_MOCK_MODE = 'false';

    await new Promise((resolve, reject) => {
      const req = createReq({ 'x-mpesa-mode': 'mock' });
      mpesaRequestMode()(req, createRes(), (err) => {
        if (err) return reject(err);
        assert.equal(req.mpesaMode, 'mock');
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      const req = createReq({ 'x-mpesa-test-mode': 'true' });
      mpesaRequestMode()(req, createRes(), (err) => {
        if (err) return reject(err);
        assert.equal(req.mpesaMode, 'mock');
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      const req = createReq();
      mpesaRequestMode({ forceMode: 'mock' })(req, createRes(), (err) => {
        if (err) return reject(err);
        assert.equal(req.mpesaMode, 'mock');
        resolve();
      });
    });
  } finally {
    process.env.MPESA_MOCK_MODE = originalEnv;
  }
});

test('PaymentService forwards mode to mpesa gateway for C2B and B2C', async () => {
  const originalMpesa = PaymentService.mpesa;
  const originalEmola = PaymentService.emola;

  const calls = [];

  PaymentService.mpesa = {
    c2b: {
      execute: async (input) => {
        calls.push({ kind: 'c2b', input });
        return { ok: true, input };
      }
    },
    b2c: {
      execute: async (input) => {
        calls.push({ kind: 'b2c', input });
        return { ok: true, input };
      }
    }
  };
  PaymentService.emola = null;

  try {
    const c2b = await PaymentService.createC2B({
      provider: 'mpesa',
      phone: '258841234567',
      amount: 10,
      reference: 'C2B-TEST',
      mode: 'mock'
    });

    const b2c = await PaymentService.createB2C({
      provider: 'mpesa',
      phone: '258841234567',
      amount: 20,
      reference: 'B2C-TEST',
      mode: 'live'
    });

    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], {
      kind: 'c2b',
      input: {
        phone: '258841234567',
        amount: 10,
        reference: 'C2B-TEST',
        mode: 'mock'
      }
    });
    assert.deepEqual(calls[1], {
      kind: 'b2c',
      input: {
        phone: '258841234567',
        amount: 20,
        reference: 'B2C-TEST',
        mode: 'live'
      }
    });
    assert.equal(c2b.ok, true);
    assert.equal(b2c.ok, true);
  } finally {
    PaymentService.mpesa = originalMpesa;
    PaymentService.emola = originalEmola;
  }
});

test('MpesaClient returns mock responses for C2B and B2C', async () => {
  const post = axios.post;
  const get = axios.get;

  try {
    axios.post = async () => {
      throw new Error('axios.post should not be called in mock mode');
    };
    axios.get = async () => {
      throw new Error('axios.get should not be called in mock mode');
    };

    const c2b = await MpesaClient.post('/ipg/v1x/c2bPayment/singleStage/', {
      input_TransactionReference: 'C2B-TEST'
    }, { mode: 'mock' });

    const b2c = await MpesaClient.post('/ipg/v1x/b2cPayment/', {
      input_TransactionReference: 'B2C-TEST'
    }, { mode: 'mock' });

    assert.equal(c2b.mock, true);
    assert.equal(b2c.mock, true);
    assert.equal(c2b.output_ResponseCode, 'INS-0');
    assert.equal(b2c.output_ResponseCode, 'INS-0');
  } finally {
    axios.post = post;
    axios.get = get;
  }
});

test('MpesaClient live mode builds the external request', async () => {
  const post = axios.post;
  const getAccessToken = MpesaAuth.getAccessToken;
  const originalHost = process.env.MPESA_API_HOST;
  const originalKey = process.env.MPESA_API_KEY;

  try {
    process.env.MPESA_API_HOST = 'api.sandbox.vm.co.mz';
    process.env.MPESA_API_KEY = 'live-api-key';
    MpesaAuth.getAccessToken = async () => 'live-session-token';

    let captured;
    axios.post = async (url, payload, config) => {
      captured = { url, payload, config };
      return { data: { output_ResponseCode: 'INS-0', live: true } };
    };

    const response = await MpesaClient.post('/ipg/v1x/c2bPayment/singleStage/', {
      input_TransactionReference: 'LIVE-TEST'
    }, { mode: 'live' });

    assert.equal(response.live, true);
    assert.equal(captured.url, 'https://api.sandbox.vm.co.mz:18352/ipg/v1x/c2bPayment/singleStage/');
    assert.equal(captured.config.headers.Authorization, 'Bearer live-session-token');
    assert.equal(captured.config.headers['Content-Type'], 'application/json');
    assert.equal(captured.config.headers.Accept, 'application/json');
  } finally {
    axios.post = post;
    MpesaAuth.getAccessToken = getAccessToken;
    process.env.MPESA_API_HOST = originalHost;
    process.env.MPESA_API_KEY = originalKey;
  }
});