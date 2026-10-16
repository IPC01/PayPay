const MpesaC2B = require('./MpesaC2B');
const MpesaB2C = require('./MpesaB2C');
const MpesaStatus = require('./MpesaStatus');
const MpesaReversal = require('./MpesaReversal');

module.exports = {
  c2b: MpesaC2B,
  b2c: MpesaB2C,
  status: MpesaStatus,
  reversal: MpesaReversal,
};