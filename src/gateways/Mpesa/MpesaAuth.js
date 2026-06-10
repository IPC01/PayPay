const axios = require('axios');

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

function requireLiveConfig() {
  const missing = [];

  if (!process.env.MPESA_API_HOST) {
    missing.push('MPESA_API_HOST');
  }

  if (!process.env.MPESA_API_KEY) {
    missing.push('MPESA_API_KEY');
  }

  if (missing.length) {
    throw new Error(`Missing M-Pesa config: ${missing.join(', ')}`);
  }
}

class MpesaAuth {
  async getAccessToken(options = {}) {
    if (isMockMode(options.mode)) {
      return 'mock-mpesa-session';
    }

    requireLiveConfig();

    try {
      const url = `https://${process.env.MPESA_API_HOST}:18352/ipg/v1x/getSession/`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.MPESA_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...buildOriginHeaders()
        },
        timeout: 30000
      });

      console.log('MPESA AUTH SUCCESS:', response.data);

      return response.data.output_SessionID;

    } catch (error) {
      console.log('🔥 MPESA AUTH ERROR FULL:');
      console.log('STATUS:', error.response?.status);
      console.log('DATA:', error.response?.data);
      console.log('HEADERS:', error.response?.headers);
      console.log('MESSAGE:', error.message);

      throw new Error(
        error.response?.data?.output_ResponseDesc ||
        error.response?.data?.message ||
        error.message ||
        'Erro ao obter token M-Pesa'
      );
    }
  }
}

module.exports = new MpesaAuth();