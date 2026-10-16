const { randomBytes } = require('crypto');

function paymentError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode, requestNotSent: true });
}

function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('258')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^(84|85)\d{7}$/.test(digits)) {
    throw paymentError('Número M-Pesa inválido. Use 84 ou 85 seguido de 7 dígitos.');
  }
  return `258${digits}`;
}

function normalizeAmount(value) {
  if (!['number', 'string'].includes(typeof value)) {
    throw paymentError('Informe um valor numérico para a transação.');
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99 ||
      Math.abs(amount - Number(amount.toFixed(2))) > 0.000001) {
    throw paymentError('Informe um valor positivo com no máximo duas casas decimais.');
  }
  return Number(amount.toFixed(2));
}

// M-Pesa only accepts alphanumeric references; TransactionReference is limited to 20 characters.
const REFERENCE_MAX_LENGTH = 20;
const PREFIX_MAX_LENGTH = 8;
const REFERENCE_PATTERN = /^[A-Za-z0-9]{1,20}$/;
const PREFIX_PATTERN = /^[A-Za-z0-9]{1,8}$/;
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function sanitizePrefix(prefix) {
  return String(prefix || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, PREFIX_MAX_LENGTH);
}

function generateReference(prefix) {
  const cleanPrefix = sanitizePrefix(prefix);
  const bytes = randomBytes(REFERENCE_MAX_LENGTH - cleanPrefix.length);
  let random = '';
  for (const byte of bytes) random += ALPHABET[byte % ALPHABET.length];
  return `${cleanPrefix}${random}`;
}

function validateReference(reference) {
  const value = String(reference).trim();
  if (!REFERENCE_PATTERN.test(value)) {
    throw paymentError('A referência deve ter de 1 a 20 caracteres, apenas letras e números.');
  }
  return value;
}

function toThirdPartyReference(id) {
  return String(id).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function buildPayload({ phone, amount, reference, thirdPartyReference }) {
  const serviceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE;
  if (!serviceProviderCode) {
    throw paymentError('MPESA_SERVICE_PROVIDER_CODE is required', 503);
  }
  if (!reference || !thirdPartyReference) {
    throw paymentError('Transaction reference and third-party reference are required');
  }
  return {
    input_TransactionReference: String(reference),
    input_CustomerMSISDN: normalizePhone(phone),
    input_Amount: String(normalizeAmount(amount)),
    input_ThirdPartyReference: String(thirdPartyReference),
    input_ServiceProviderCode: serviceProviderCode
  };
}

function getOutcome(response) {
  const code = response?.output_ResponseCode;
  if (code === 'INS-0') return 'success';
  // An absent response, timeout or duplicate may refer to a payment already accepted.
  if (!code || !/^INS-\d+$/.test(code) || ['INS-1', 'INS-9', 'INS-10', 'INS-18'].includes(code)) return 'pending';
  return 'failed';
}

function responseMessage(response) {
  return response?.output_ResponseDesc || response?.output_ResponseDescription || null;
}

module.exports = {
  paymentError, normalizePhone, normalizeAmount, generateReference, buildPayload, getOutcome, responseMessage,
  validateReference, toThirdPartyReference, sanitizePrefix, PREFIX_PATTERN
};
