export default function ReversalConfirmation({ transaction }) {
  const money = (value) => Number(value || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' });
  const fields = [
    ['Referência', transaction.reference || transaction.id],
    ['Modalidade', transaction.paymentMode],
    ['Montante do estorno', money(transaction.amount)],
    ['Custo do saque (não devolvido)', transaction.paymentMode === 'B2C' ? money(transaction.fee) : null],
    ['Carteira', transaction.walletCode || transaction.wallet?.code || transaction.toWalletId || transaction.fromWalletId],
    ['Telefone', transaction.phone],
    ['ID M-Pesa', transaction.providerTransactionId]
  ];

  return (
    <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 dark:bg-slate-900">
      {fields.filter(([, value]) => value != null && value !== '').map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
          <dd className="mt-1 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
