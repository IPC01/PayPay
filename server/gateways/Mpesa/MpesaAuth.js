const crypto = require('crypto');

function normalizePublicKey(publicKey) {
  if (!publicKey) return undefined;
  let key = publicKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, '').replace(/\s+/g, '');
  const lines = key.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

function getEncryptedApiKey(apiKey, publicKey) {
  if (!apiKey || !publicKey) {
    throw new Error('MPESA_API_KEY and MPESA_PUBLIC_KEY are required for M-Pesa auth');
  }

  const encrypted = crypto.publicEncrypt(
    {
      key: normalizePublicKey(publicKey),
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(apiKey, 'utf8')
  );

  return encrypted.toString('base64');
}

class MpesaAuth {
  // M-Pesa Mozambique (iPG v1x) authenticates each request with the API key
  // encrypted by the public key; the getSession endpoint is blocked by the WAF.
  async getAccessToken() {
    try {
      return getEncryptedApiKey(process.env.MPESA_API_KEY, process.env.MPESA_PUBLIC_KEY);
    } catch (error) {
      throw new Error(`Credenciais M-Pesa inválidas: ${error.message}`);
    }
  }
}

module.exports = new MpesaAuth();
module.exports.getEncryptedApiKey = getEncryptedApiKey;
