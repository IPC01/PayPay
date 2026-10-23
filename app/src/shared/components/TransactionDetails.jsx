import { useEffect, useRef } from 'react';
import { canReverseTransaction } from '../../helpers/transactionReversal';
import { canQueryTransactionStatus } from '../../helpers/transactionStatus';

const STATUS_LABELS = {
  success: 'Sucesso',
  pending: 'Pendente',
  failed: 'Falhou',
  reversed: 'Estornada',
  processing: 'Processando'
};

const TYPE_LABELS = {
  c2b: 'C2B',
  b2c: 'B2C',
  deposit: 'Depósito',
  withdrawal: 'Levantamento',
  transfer: 'Transferência',
  reversal: 'Estorno'
};

const currency = (value) => Number(value || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' });
const date = (value) => value ? new Date(value).toLocaleString('pt-PT') : 'N/A';

export default function TransactionDetails({
  transaction, queryResult, queryError, querying, reversing, onQuery, onReverse, onBack
}) {
  const headingRef = useRef(null);
  const busy = querying || reversing;

  useEffect(() => {
    headingRef.current.focus();
  }, []);

  const fee = Number(transaction.fee || 0);
  const amount = Number(transaction.amount || 0);
  const isReversal = transaction.type === 'reversal';

  const fields = [
    ['ID da Transação', transaction.id],
    ['Referência', transaction.reference],
    ['Status local', STATUS_LABELS[transaction.status] || transaction.status],
    ['Tipo', TYPE_LABELS[transaction.type] || transaction.type],
    ['Carteira', transaction.walletCode || transaction.wallet?.code],
    ['Utilizador', transaction.walletInfo?.user?.name],
    ['Email', transaction.walletInfo?.user?.email],
    ['Montante', currency(transaction.amount)],
    ['Taxa da plataforma', currency(transaction.fee)],
    // C2B: a taxa é retida — mostra quanto foi efetivamente creditado na carteira
    ...(fee > 0 && transaction.paymentMode === 'C2B' && !isReversal
      ? [['Creditado na carteira', currency(Number((amount - fee).toFixed(2)))]]
      : []),
    // B2C: mostra o total debitado (valor + taxa retida pela plataforma)
    ...(fee > 0 && transaction.paymentMode === 'B2C' && !isReversal
      ? [['Total debitado da carteira', currency(Number((amount + fee).toFixed(2)))]]
      : []),
    ['Telefone', transaction.phone],
    ['Provedor', transaction.provider],
    ['Modalidade', transaction.paymentMode],
    ['ID M-Pesa', transaction.providerTransactionId],
    ['ID de conversa M-Pesa', transaction.providerReference],
    ['Descrição', transaction.description],
    ['Data de Criação', date(transaction.createdAt)],
    ['Última Atualização', date(transaction.updatedAt)]
  ];

  return (
    <section
      aria-labelledby="transaction-details-title"
      className="w-full rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
    >
      <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700">
        <h2 ref={headingRef} tabIndex={-1} id="transaction-details-title" className="text-xl font-semibold">Detalhes da Transação</h2>
        <button type="button" onClick={onBack} disabled={busy}
          className="rounded-lg px-3 py-2 text-sm text-brand-700 hover:bg-slate-100 disabled:opacity-50 dark:text-brand-300 dark:hover:bg-slate-700">
          Voltar às transações
        </button>
      </div>
      <div className="space-y-6 p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.filter(([, value]) => value != null && value !== '').map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="mt-1 break-words text-sm">{value}</dd>
            </div>
          ))}
        </dl>
        {queryError && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {queryError}
          </p>
        )}
        {queryResult && (
          <section aria-live="polite" className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
            <h4 className="font-semibold">Última consulta M-Pesa</h4>
            <p>Estado M-Pesa: {queryResult.providerStatus || 'Não informado'}</p>
            <p>Código: {queryResult.response?.output_ResponseCode || 'Não informado'}</p>
            <p>{queryResult.response?.output_ResponseDesc || queryResult.response?.output_ResponseDescription}</p>
            <p>Estado local: {STATUS_LABELS[queryResult.status] || queryResult.status}</p>
          </section>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 p-6 sm:flex-row dark:border-slate-700">
        {canQueryTransactionStatus(transaction) && (
          <button type="button" onClick={() => onQuery(transaction)} disabled={busy}
            className="flex-1 rounded-xl border border-brand-300 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20">
            {querying ? 'A consultar...' : 'Consultar estado M-Pesa'}
          </button>
        )}
        {onReverse && canReverseTransaction(transaction) && (
          <button type="button" onClick={() => onReverse(transaction)} disabled={busy}
            className="flex-1 rounded-xl border border-purple-300 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20">
            {reversing ? 'A estornar...' : 'Estornar'}
          </button>
        )}
      </div>
    </section>
  );
}
