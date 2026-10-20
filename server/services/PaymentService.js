const { paymentError } = require('../helpers/mpesaPayment');

class PaymentService {
  constructor() {
    this.mpesa = require('../gateways/Mpesa');
  }

  async createC2B({ provider = 'mpesa', ...input }) {
    if (String(provider).toLowerCase() !== 'mpesa') {
      throw paymentError('Apenas o provedor M-Pesa está disponível.');
    }
    return this.mpesa.c2b.execute(input);
  }

  async createB2C({ provider = 'mpesa', ...input }) {
    if (String(provider).toLowerCase() !== 'mpesa') {
      throw paymentError('Apenas o provedor M-Pesa está disponível.');
    }
    return this.mpesa.b2c.execute(input);
  }

  async reverse({ provider = 'mpesa', ...input }) {
    if (String(provider).toLowerCase() !== 'mpesa') {
      throw paymentError('Apenas o provedor M-Pesa está disponível.');
    }
    return this.mpesa.reversal.execute(input);
  }

  async queryStatus({ provider = 'mpesa', ...input }) {
    if (String(provider).toLowerCase() !== 'mpesa') {
      throw paymentError('Apenas o provedor M-Pesa está disponível.');
    }
    return this.mpesa.status.execute(input);
  }
}

module.exports = new PaymentService();
