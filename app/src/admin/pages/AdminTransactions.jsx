import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { canReverseTransaction, reversalConfirmMessage, reversalResultNotification } from '../../helpers/transactionReversal';

const STATUS_LABELS = {
  success: 'Sucesso',
  pending: 'Pendente',
  failed: 'Falhou',
  reversed: 'Estornada'
};

function AdminTransactions() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reversingId, setReversingId] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/transactions');
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reverseTransaction = async (transaction) => {
    if (!window.confirm(reversalConfirmMessage(transaction))) return;
    try {
      setReversingId(transaction.id);
      const result = await authRequest(`/api/admin/transactions/${transaction.id}/reverse`, { method: 'POST' });
      notify(reversalResultNotification(result));
    } catch (err) {
      notify({
        type: 'error',
        title: 'Estorno não realizado',
        message: err.message || 'Não foi possível estornar a transação.'
      });
    } finally {
      setReversingId(null);
      await loadTransactions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Transações</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Visualize os últimos movimentos registados para todas as carteiras.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Referência</th>
              <th className="px-6 py-4">Carteira</th>
              <th className="px-6 py-4">Utilizador</th>
              <th className="px-6 py-4">Montante</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-700 dark:bg-slate-800">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar transações...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhuma transação encontrada.</td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{transaction.reference || transaction.id}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{transaction.walletCode}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{transaction.walletInfo?.user?.name || '—'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {Number(transaction.amount || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{STATUS_LABELS[transaction.status] || transaction.status}{transaction.type === 'reversal' ? ' (estorno)' : ''}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(transaction.createdAt).toLocaleDateString('pt-PT')}</td>
                  <td className="px-6 py-4">
                    {canReverseTransaction(transaction) ? (
                      <button
                        type="button"
                        onClick={() => reverseTransaction(transaction)}
                        disabled={reversingId === transaction.id}
                        className="rounded-xl border border-purple-300 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20"
                      >
                        {reversingId === transaction.id ? 'A estornar...' : 'Estornar'}
                      </button>
                    ) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminTransactions;
