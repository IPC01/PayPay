const axios = require('axios');

function normalizeOrigin(origin) {
  if (!origin) return undefined;
  return origin.startsWith('http://') || origin.startsWith('https://')
    ? origin
    : `https://${origin}`;
}

class MpesaAuth {
  async getAccessToken() {
    try {
      const url = `https://${process.env.MPESA_API_HOST}:18352/ipg/v1x/getSession/`;
      const origin = normalizeOrigin(process.env.MPESA_ORIGIN);

      const response = await axios.get(url, {
        headers: {
          Origin: origin,
          Authorization: `Bearer ${process.env.MPESA_API_KEY}`,
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