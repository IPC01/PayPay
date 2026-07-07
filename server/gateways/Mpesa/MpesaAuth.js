const axios = require('axios');
const crypto = require('crypto');

function normalizeOrigin(origin) {
  if (!origin) {
    return undefined;
  }

  return origin
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');
}

function buildOriginHeaders() {
  const host = normalizeOrigin(process.env.MPESA_ORIGIN);

  if (!host) {
    return {
      'User-Agent': 'PayPay/1.0',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  const origin = `https://${host}`;

  return {
    Origin: origin,
    Referer: `${origin}/`,
    'User-Agent': 'PayPay/1.0',
    'X-Requested-With': 'XMLHttpRequest'
  };
}

function buildBaseHeaders(authorization) {
  return {
    Authorization: authorization,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'PayPay/1.0',
    'X-Requested-With': 'XMLHttpRequest'
  };
}

function buildSessionUrl() {
  const host = process.env.MPESA_API_HOST;
  return `https://${host}:18352/ipg/v1x/getSession/`;
}

function isImperva403(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  return status === 403 && typeof data === 'string' && /forbidden|administrative rules|imperva/i.test(data);
}

async function requestSession(url, headers) {
  const response = await axios.get(url, {
    headers,
    timeout: 30000
  });

  return response.data;
}

function normalizePublicKey(publicKey) {
  if (!publicKey) return undefined;
  let key = publicKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\s+/g, '');
  const lines = key.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

function getEncryptedApiKey(apiKey, publicKey) {
  if (!apiKey || !publicKey) {
    throw new Error('MPESA_API_KEY and MPESA_PUBLIC_KEY are required for M-Pesa auth');
  }

  const pemKey = normalizePublicKey(publicKey);
  const encrypted = crypto.publicEncrypt(
    {
      key: pemKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(apiKey, 'utf8')
  );

  return encrypted.toString('base64');
}

class MpesaAuth {
  async getAccessToken() {
    const url = buildSessionUrl();
    const host = process.env.MPESA_API_HOST;
    const originHost = normalizeOrigin(process.env.MPESA_ORIGIN) || 'not-set';
    const authorization = `Bearer ${getEncryptedApiKey(
      process.env.MPESA_API_KEY,
      process.env.MPESA_PUBLIC_KEY
    )}`;

    try {
      // Attempt 1: use full browser-like origin headers.
      const firstHeaders = {
        ...buildBaseHeaders(authorization),
        ...buildOriginHeaders()
      };

      const firstData = await requestSession(url, firstHeaders);
      console.log('MPESA AUTH SUCCESS:', firstData);
      return firstData.output_SessionID;

    } catch (error) {
      if (isImperva403(error)) {
        try {
          // Attempt 2: retry without Origin/Referer in case WAF policy blocks cross-origin patterns.
          const fallbackHeaders = buildBaseHeaders(authorization);
          const fallbackData = await requestSession(url, fallbackHeaders);
          console.log('MPESA AUTH SUCCESS (FALLBACK):', fallbackData);
          return fallbackData.output_SessionID;
        } catch (fallbackError) {
          console.log('🔥 MPESA AUTH ERROR FULL (FALLBACK):');
          console.log('STATUS:', fallbackError.response?.status);
          console.log('DATA:', fallbackError.response?.data);
          console.log('HEADERS:', fallbackError.response?.headers);
          console.log('MESSAGE:', fallbackError.message);

          throw new Error(
            `M-Pesa bloqueou a autenticação (HTTP 403 - Imperva). host=${host}, origin=${originHost}. Verifique MPESA_ORIGIN, whitelist de IP e credenciais do sandbox.`
          );
        }
      }

      console.log('🔥 MPESA AUTH ERROR FULL:');
      console.log('STATUS:', error.response?.status);
      console.log('DATA:', error.response?.data);
      console.log('HEADERS:', error.response?.headers);
      console.log('MESSAGE:', error.message);

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403 && typeof data === 'string' && /forbidden|administrative rules/i.test(data)) {
        throw new Error(
          `M-Pesa bloqueou a autenticação (HTTP 403 - Imperva). host=${host}, origin=${originHost}. Verifique MPESA_ORIGIN, whitelist de IP e credenciais do sandbox.`
        );
      }

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