const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const axios = require('axios');

const mpesaRequestMode = require('../middleware/mpesaRequestMode');
const PaymentService = require('../services/PaymentService');
const MpesaClient = require('../gateways/Mpesa/MpesaClient');
const MpesaAuth = require('../gateways/Mpesa/MpesaAuth');
const MpesaC2B = require('../gateways/Mpesa/MpesaC2B');
const MpesaB2C = require('../gateways/Mpesa/MpesaB2C');

// Fictitious values: tests never use the real credentials from .env.
Object.assign(process.env, {
  MPESA_API_HOST: 'api.sandbox.vm.co.mz',
  MPESA_API_KEY: 'test-api-key',
  MPESA_PUBLIC_KEY: 'test-public-key',
  MPESA_SERVICE_PROVIDER_CODE: '171717',
  MPESA_ORIGIN: 'developer.mpesa.vm.co.mz',
  MPESA_C2B_PORT: '18352',
  MPESA_B2C_PORT: '18345'
});

test('live calls refuse to run when an .env value is missing', async (t) => {
  const original = process.env.MPESA_SERVICE_PROVIDER_CODE;
  delete process.env.MPESA_SERVICE_PROVIDER_CODE;
  t.after(() => { process.env.MPESA_SERVICE_PROVIDER_CODE = original; });
  const post = t.mock.method(axios, 'post', async () => ({ data: {} }));
  await assert.rejects(
    MpesaClient.post('/ipg/v1x/c2bPayment/singleStage/', {}, { mode: 'live' }),
    (error) => error.requestNotSent === true && /MPESA_SERVICE_PROVIDER_CODE/.test(error.message)
  );
  assert.equal(post.mock.callCount(), 0);
});

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
    assert.deepEqual(Object.keys(captured.config.headers).sort(), ['Authorization', 'Content-Type', 'Origin']);
  } finally {
    axios.post = post;
    MpesaAuth.getAccessToken = getAccessToken;
    process.env.MPESA_API_HOST = originalHost;
    process.env.MPESA_API_KEY = originalKey;
  }
});

test('C2B and B2C send the documented five string fields and distinct references', async (t) => {
  const originalCode = process.env.MPESA_SERVICE_PROVIDER_CODE;
  process.env.MPESA_SERVICE_PROVIDER_CODE = '171717';
  t.after(() => {
    if (originalCode === undefined) delete process.env.MPESA_SERVICE_PROVIDER_CODE;
    else process.env.MPESA_SERVICE_PROVIDER_CODE = originalCode;
  });
  const calls = [];
  t.mock.method(MpesaClient, 'post', async (...args) => { calls.push(args); return { output_ResponseCode: 'INS-0' }; });
  for (const gateway of [MpesaC2B, MpesaB2C]) {
    await gateway.execute({
      phone: '841234567', amount: 10.25, reference: 'BILL-1', thirdPartyReference: 'unique-platform-id', mode: 'live'
    });
  }
  assert.equal(calls[0][0], '/ipg/v1x/c2bPayment/singleStage/');
  assert.equal(calls[1][0], '/ipg/v1x/b2cPayment/');
  for (const [, payload, options] of calls) {
    assert.deepEqual(payload, {
      input_TransactionReference: 'BILL-1',
      input_CustomerMSISDN: '258841234567',
      input_Amount: '10.25',
      input_ThirdPartyReference: 'unique-platform-id',
      input_ServiceProviderCode: '171717'
    });
    assert.equal(options.mode, 'live');
  }
});

test('live B2C uses its own port and documented Origin header', async (t) => {
  const host = process.env.MPESA_API_HOST;
  const port = process.env.MPESA_B2C_PORT;
  const origin = process.env.MPESA_ORIGIN;
  process.env.MPESA_API_HOST = 'api.sandbox.vm.co.mz';
  process.env.MPESA_B2C_PORT = '18345';
  process.env.MPESA_ORIGIN = 'developer.mpesa.vm.co.mz';
  t.after(() => {
    for (const [key, value] of [['MPESA_API_HOST', host], ['MPESA_B2C_PORT', port], ['MPESA_ORIGIN', origin]]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  t.mock.method(MpesaAuth, 'getAccessToken', async () => 'test-session');
  t.mock.method(axios, 'post', async (url, payload, config) => {
    assert.equal(url, 'https://api.sandbox.vm.co.mz:18345/ipg/v1x/b2cPayment/');
    assert.equal(config.headers.Origin, 'developer.mpesa.vm.co.mz');
    return { data: { output_ResponseCode: 'INS-0' } };
  });
  await MpesaClient.post('/ipg/v1x/b2cPayment/', {}, { mode: 'live' });
});

test('only M-Pesa is supported', async () => {
  await assert.rejects(PaymentService.createC2B({ provider: 'emola' }), /M-Pesa/);
  await assert.rejects(PaymentService.createB2C({ provider: 'emola' }), /M-Pesa/);
});

test('HTTP payment routes force live mode even with mock headers or environment', () => {
  const original = process.env.MPESA_MOCK_MODE;
  try {
    process.env.MPESA_MOCK_MODE = 'true';
    const req = createReq({ 'x-mpesa-mode': 'mock', 'x-mpesa-test-mode': 'true' });
    mpesaRequestMode({ forceMode: 'live' })(req, {}, () => {});
    assert.equal(req.mpesaMode, 'live');
  } finally {
    if (original === undefined) delete process.env.MPESA_MOCK_MODE;
    else process.env.MPESA_MOCK_MODE = original;
  }
});

test('provider rejection returned with HTTP error retains the M-Pesa response', async (t) => {
  const original = process.env.MPESA_API_HOST;
  process.env.MPESA_API_HOST = 'api.sandbox.vm.co.mz';
  t.after(() => {
    if (original === undefined) delete process.env.MPESA_API_HOST;
    else process.env.MPESA_API_HOST = original;
  });
  t.mock.method(MpesaAuth, 'getAccessToken', async () => 'test-token');
  const data = { output_ResponseCode: 'INS-2051', output_ResponseDesc: 'Invalid MSISDN' };
  t.mock.method(axios, 'post', async () => {
    throw Object.assign(new Error('HTTP 400'), { response: { status: 400, data } });
  });
  assert.deepEqual(await MpesaClient.post('/ipg/v1x/b2cPayment/', {}, { mode: 'live' }), data);
});

test('auth encrypts the API key locally without calling getSession', async (t) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = publicKey.export({ type: 'spki', format: 'pem' });
  const keys = { MPESA_API_KEY: process.env.MPESA_API_KEY, MPESA_PUBLIC_KEY: process.env.MPESA_PUBLIC_KEY };
  process.env.MPESA_API_KEY = 'secret-api-key';
  process.env.MPESA_PUBLIC_KEY = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----|\s+/g, '');
  t.after(() => {
    for (const [key, value] of Object.entries(keys)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const get = t.mock.method(axios, 'get', async () => { throw new Error('network not expected'); });
  const token = await MpesaAuth.getAccessToken();
  const decrypted = crypto.privateDecrypt(
    { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(token, 'base64')
  ).toString('utf8');
  assert.equal(decrypted, 'secret-api-key');
  assert.equal(get.mock.callCount(), 0);
});

test('HTTP 4xx without M-Pesa response code is a rejected, not-sent payment', async (t) => {
  const original = process.env.MPESA_API_HOST;
  process.env.MPESA_API_HOST = 'api.sandbox.vm.co.mz';
  t.after(() => {
    if (original === undefined) delete process.env.MPESA_API_HOST;
    else process.env.MPESA_API_HOST = original;
  });
  t.mock.method(MpesaAuth, 'getAccessToken', async () => 'test-token');
  t.mock.method(axios, 'post', async () => {
    throw Object.assign(new Error('HTTP 403'), { response: { status: 403, data: '<html>403 Forbidden</html>' } });
  });
  await assert.rejects(
    MpesaClient.post('/ipg/v1x/c2bPayment/singleStage/', {}, { mode: 'live' }),
    (error) => error.requestNotSent === true && /HTTP 403/.test(error.message)
  );
});