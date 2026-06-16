import Transactions from '../client/Transactions';

function AdminTransactions() {
  return <Transactions adminView />;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/transactions');
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-700 dark:bg-slate-800">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar transações...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhuma transação encontrada.</td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{transaction.reference || transaction.id}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{transaction.walletCode}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{transaction.walletInfo?.user?.name || '—'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{Number(transaction.amount || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{transaction.status}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(transaction.createdAt).toLocaleDateString('pt-PT')}</td>
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
