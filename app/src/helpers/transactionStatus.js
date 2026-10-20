export function canQueryTransactionStatus(transaction) {
  return transaction?.provider === 'mpesa' &&
    ['C2B', 'B2C'].includes(transaction.paymentMode);
}

export function transactionStatusNotification(result) {
  if (result.response?.output_ResponseCode !== 'INS-0') {
    return {
      type: 'error',
      title: 'Consulta não confirmada',
      message: result.response?.output_ResponseDesc || result.response?.output_ResponseDescription ||
        'O M-Pesa não confirmou o estado da transação. O estado local foi preservado.'
    };
  }
  if (result.providerStatus === 'Completed') {
    return {
      type: 'success',
      title: 'Transação confirmada',
      message: `O M-Pesa confirmou a transação ${result.reference || ''}.`
    };
  }
  if (['Cancelled', 'Expired'].includes(result.providerStatus)) {
    return {
      type: 'error',
      title: 'Transação não concluída',
      message: `O M-Pesa informou o estado ${result.providerStatus || 'não concluído'}.`
    };
  }
  return {
    type: 'warning',
    title: 'Estado M-Pesa não confirmado',
    message: `O M-Pesa ainda não confirmou a transação${result.providerStatus ? ` (estado: ${result.providerStatus})` : ''}. Estado local preservado.`
  };
}
