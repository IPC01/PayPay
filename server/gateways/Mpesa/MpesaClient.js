const axios = require('axios');
const { randomUUID } = require('crypto');
const MpesaAuth = require('./MpesaAuth');

function isMockMode(mode) {
  if (mode) {
    return String(mode).toLowerCase() === 'mock';
  }

  return String(process.env.MPESA_MOCK_MODE).toLowerCase() === 'true';
}

function buildOriginHeaders() {
  return { Origin: process.env.MPESA_ORIGIN };
}

function buildMockResponse(path, payload) {
  const now = randomUUID();
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REQUIRED_LIVE_CONFIG = [
  'MPESA_API_HOST',
  'MPESA_API_KEY',
  'MPESA_PUBLIC_KEY',
  'MPESA_SERVICE_PROVIDER_CODE',
  'MPESA_ORIGIN'
];

function resolvePortVariable(path) {
  const lower = path.toLowerCase();
  if (lower.includes('reversal')) return 'MPESA_REVERSAL_PORT';
  if (lower.includes('b2c')) return 'MPESA_B2C_PORT';
  return 'MPESA_C2B_PORT';
}

// All M-Pesa connection values come from server/.env; there are no hardcoded fallbacks.
function requireLiveConfig(extra = []) {
  const missing = [...REQUIRED_LIVE_CONFIG, ...extra].filter((name) => !String(process.env[name] || '').trim());
  if (missing.length) {
    throw new Error(`Configuração M-Pesa em falta no .env: ${missing.join(', ')}`);
  }
}

class MpesaClient {
  async post(path, payload, options = {}) {
    return this.send('post', path, payload, options);
  }

  async put(path, payload, options = {}) {
    return this.send('put', path, payload, options);
  }

  async send(method, path, payload, options = {}) {
    if (isMockMode(options.mode)) {
      // simula o tempo de espera pela confirmação do pagamento no telemóvel do utilizador
      const configuredDelay = Number(process.env.MPESA_MOCK_DELAY_MS);
      const waitMs = Number.isFinite(configuredDelay) && configuredDelay >= 0 ? configuredDelay : 4000;
      await wait(waitMs);
      return buildMockResponse(path, payload);
    }

    let token;
    try {
      requireLiveConfig([resolvePortVariable(path), ...(options.requiredConfig || [])]);
      token = await MpesaAuth.getAccessToken(options);
      if (!token) throw new Error('M-Pesa authentication returned no access token');
    } catch (error) {
      error.requestNotSent = true;
      throw error;
    }
    const port = process.env[resolvePortVariable(path)];

    const baseUrl = `https://${process.env.MPESA_API_HOST}:${port}`;

    try {
      const response = await (method === 'put' ? axios.put : axios.post)(
      `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
      payload,
      {
        // The synchronous response only arrives after the customer answers the USSD PIN prompt.
        timeout: Number(process.env.MPESA_TIMEOUT_MS) || 120000,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...buildOriginHeaders()
        },
      }
    );

      return response.data;
    } catch (error) {
      if (error.response?.data?.output_ResponseCode) {
        return error.response.data;
      }
      const status = error.response?.status;
      if (status >= 400 && status < 500) {
        const detail = status === 401
          ? 'MPESA_API_KEY/MPESA_PUBLIC_KEY do .env não foram aceites'
          : error.response.data?.output_error
          || (typeof error.response.data === 'string' ? 'pedido bloqueado pelo gateway' : JSON.stringify(error.response.data));
        const rejected = new Error(`M-Pesa rejeitou o pedido (HTTP ${status}): ${detail}`);
        rejected.requestNotSent = true;
        throw rejected;
      }
      // Once submitted, a transport failure does not prove that funds were not transferred.
      error.requestNotSent = false;
      throw error;
    }
  }
}

module.exports = new MpesaClient();