export function canReverseTransaction(tx) {
  if (!tx || tx.status !== 'success' || tx.type === 'reversal' || !tx.providerTransactionId) return false;
  if (tx.paymentMode === 'C2B') return Boolean(tx.toWalletId);
  if (tx.paymentMode === 'B2C') return Boolean(tx.fromWalletId);
  return false;
}

export function reversalConfirmMessage(tx) {
  const amount = Number(tx.amount || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' });
  const effect = tx.paymentMode === 'C2B'
    ? `${amount} será debitado da carteira e devolvido ao número ${tx.phone}.`
    : `${amount} será retirado do número ${tx.phone} e devolvido à carteira (o custo do saque não é devolvido).`;
  return `Estornar a transação ${tx.reference || tx.id}?\n\n${effect}\n\nO estorno é total e não pode ser repetido.`;
}

export function reversalResultNotification(result) {
  if (result.pending) {
    return {
      type: 'warning',
      title: 'Estorno em confirmação',
      message: `${result.message} Referência: ${result.reference}. Não repita o pedido.`
    };
  }
  return {
    type: 'success',
    title: 'Estorno concluído',
    message: `O M-Pesa confirmou o estorno. Referência: ${result.reference}.`
  };
}
