const axios = require('axios');
const crypto = require('crypto');

function normalizeOrigin(origin) {
  if (!origin) return undefined;
  return origin.startsWith('http://') || origin.startsWith('https://')
    ? origin
    : `https://${origin}`;
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
    try {
      const url = `https://${process.env.MPESA_API_HOST}:18352/ipg/v1x/getSession/`;
      const origin = normalizeOrigin(process.env.MPESA_ORIGIN);
      const authorization = `Bearer ${getEncryptedApiKey(
        process.env.MPESA_API_KEY,
        process.env.MPESA_PUBLIC_KEY
      )}`;

      const response = await axios.get(url, {
        headers: {
          Origin: origin,
          Authorization: authorization,
          'Content-Type': 'application/json',
          Accept: 'application/json'
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