const axios = require('axios');
const MpesaAuth = require('./MpesaAuth');

function isMockMode(mode) {
  if (mode) {
    return String(mode).toLowerCase() === 'mock';
  }

  return String(process.env.MPESA_MOCK_MODE).toLowerCase() === 'true';
}

function normalizeOrigin(origin) {
  if (!origin) return undefined;
  return origin
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');
}

function buildOriginHeaders() {
  const host = normalizeOrigin(process.env.MPESA_ORIGIN);

  if (!host) {
    return {};
  }

  const origin = `https://${host}`;

  return {
    Origin: origin,
    Referer: `${origin}/`,
    'User-Agent': 'PayPay/1.0',
    'X-Requested-With': 'XMLHttpRequest'
  };
}

function buildMockResponse(path, payload) {
  const now = Date.now();
  const isB2C = path.toLowerCase().includes('b2c');

  return {
    output_ResponseCode: 'INS-0',
    output_ResponseDesc: isB2C ? 'B2C request accepted (mock)' : 'C2B request accepted (mock)',
    output_ConversationID: `mock-conv-${now}`,
    output_TransactionID: `mock-tx-${now}`,
    mock: true,
    path,
    payload
  };
}

function requireLiveConfig() {
  const missing = [];

  if (!process.env.MPESA_API_HOST) {
    missing.push('MPESA_API_HOST');
  }

  if (missing.length) {
    throw new Error(`Missing M-Pesa config: ${missing.join(', ')}`);
  }
}

class MpesaClient {
  async post(path, payload, options = {}) {
    if (isMockMode(options.mode)) {
      return buildMockResponse(path, payload);
    }

    requireLiveConfig();

    const token = await MpesaAuth.getAccessToken(options);
    const baseUrl = `https://${process.env.MPESA_API_HOST}:18352`;

    const response = await axios.post(
      `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
      payload,
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...buildOriginHeaders()
        },
      }
    );

    return response.data;
  }
}

module.exports = new MpesaClient();