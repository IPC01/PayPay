import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Transactions() {
  const { authRequest } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await authRequest('/api/transactions');
        setTransactions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [authRequest]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-semibold text-slate-900">Listagem de transações</h2>
        <p className="mt-2 text-slate-500">Veja todos os movimentos processados pelo sistema.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-500">ID</th>
              <th className="px-6 py-4 font-medium text-slate-500">Carteira</th>
              <th className="px-6 py-4 font-medium text-slate-500">Montante</th>
              <th className="px-6 py-4 font-medium text-slate-500">Status</th>
              <th className="px-6 py-4 font-medium text-slate-500">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-slate-500">A carregar transações...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-slate-500">Nenhuma transação encontrada.</td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{tx.id}</td>
                  <td className="px-6 py-4 text-slate-600">{tx.walletCode}</td>
                  <td className="px-6 py-4 text-slate-900">{Number(tx.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tx.status === 'success' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{new Date(tx.createdAt).toLocaleString('pt-PT')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Transactions;
