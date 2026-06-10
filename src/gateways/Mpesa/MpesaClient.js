const axios = require('axios');
const MpesaAuth = require('./MpesaAuth');

function normalizeOrigin(origin) {
  if (!origin) return undefined;
  return origin.startsWith('http://') || origin.startsWith('https://')
    ? origin
    : `https://${origin}`;
}

class MpesaClient {
  async post(path, payload) {
    const token = await MpesaAuth.getAccessToken();
    const baseUrl = `https://${process.env.MPESA_API_HOST}:18352`;
    const origin = normalizeOrigin(process.env.MPESA_ORIGIN);

    const response = await axios.post(
      `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
      payload,
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: origin,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    return response.data;
  }
}

module.exports = new MpesaClient();