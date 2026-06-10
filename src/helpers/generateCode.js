const { Wallet } = require('../models');

/**
 * Converte número para base36 (0-9 e A-Z)
 * @param {number} num - Número a ser convertido
 * @returns {string} - Código em base36 (6 dígitos)
 */
function toBase36(num, length = 6) {
  let result = num.toString(36).toUpperCase();
  return result.padStart(length, '0');
}

/**
 * Gera código único sequencial para wallet
 * Formato: 000001, 000002, ..., 999999, 00000A, 00000B, ..., ZZZZZZ
 */
async function generateUniqueCode() {
  let lastWallet = await Wallet.findOne({
    order: [['createdAt', 'DESC']],
    attributes: ['walletCode']
  });

  let nextNumber = 1;
  
  if (lastWallet && lastWallet.walletCode) {
    // Converte o último código de base36 para número
    nextNumber = parseInt(lastWallet.walletCode, 36) + 1;
  }
  
  // Limite máximo: ZZZZZZ em base36 = 36^6 - 1 = 2.176.782.335
  const maxNumber = Math.pow(36, 6) - 1;
  
  if (nextNumber > maxNumber) {
    throw new Error('Wallet code limit reached! Maximum possible codes: 2,176,782,335');
  }
  
  // Converte o número para base36 e garante 6 dígitos
  let code = toBase36(nextNumber, 6);
  
  // Verifica duplicidade por segurança
  const exists = await Wallet.findOne({
    where: { walletCode: code }
  });
  
  if (exists) {
    // Se por algum motivo existir, tenta o próximo
    return generateUniqueCode();
  }
  
  return code;
}

module.exports = generateUniqueCode;