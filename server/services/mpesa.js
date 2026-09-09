const mpesa = require('mpesa-node-api');
const db = require('../models/index.js');

const normalizePhoneNumberForMpesa = (phoneNumber) => {
    const digits = String(phoneNumber || '').replace(/\D/g, '');

    if (!digits) {
        return '';
    }

    let localPhone = digits;

    if (localPhone.startsWith('258')) {
        localPhone = localPhone.slice(3);
    } else if (localPhone.startsWith('0')) {
        localPhone = localPhone.slice(1);
    }

    if (!/^(84|85)\d{7}$/.test(localPhone)) {
        throw new Error('Número de telefone inválido para M-Pesa. Use 84/85 seguido de 7 dígitos.');
    }

    return `258${localPhone}`;
};

/**
 * Gera uma referência de transação única para M-Pesa
 * @param {number} length - Comprimento da referência (mínimo 4)
 * @returns {string} - Referência gerada (ex: ref57upbib)
 */
const transactionReference = (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'ref';

    const targetLength = Math.max(Number(length), 4);
    for (let i = 3; i < targetLength; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

/**
 * Realiza o pagamento via M-Pesa (C2B)
 * @param {number|string} amount - Valor a ser pago
 * @param {string} phoneNumber - Número do celular em formato local ou com prefixo 258
 * @returns {Promise<Object>} - Resposta da API do M-Pesa
 */
const pagamentoMpesa = async (amount, phoneNumber) => {
    const reference = transactionReference();

    try {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            throw new Error('Valor inválido informado');
        }

        if (!phoneNumber) {
            throw new Error('Número de telefone inválido');
        }

        const fullPhoneNumber = normalizePhoneNumberForMpesa(phoneNumber);

        const response = await mpesa.initiate_c2b(
            Number(amount),
            fullPhoneNumber,
            'T12344C', // Código da conta
            reference
        );

        return {
            success: true,
            status: 'success',
            reference,
            data: response
        };

    } catch (error) {
        console.error("Erro no pagamento M-Pesa:", error);

        return {
            success: false,
            status: 'error',
            message: 'Erro no processamento do pagamento',
            error: error.message,
            reference
        };
    }
};

// Exportação no estilo CommonJS
module.exports = {
    pagamentoMpesa,
    normalizePhoneNumberForMpesa
};
