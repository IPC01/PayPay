import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function AdminSubscriptions() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/subscriptions');
      setSubscriptions(data);
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar subscrições',
        message: error.message || 'Não foi possível carregar as subscrições.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Gestão de Subscrições</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja e gerencie todas as subscrições da plataforma.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
          <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-4">Usuário</th>
              <th className="px-4 py-4">Pacote</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Início</th>
              <th className="px-4 py-4">Expira</th>
              <th className="px-4 py-4">Auto-renovação</th>
              <th className="px-4 py-4">Valor pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  A carregar subscrições...
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhuma subscrição encontrada.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{sub.User?.name || sub.User?.email || 'Usuário'}</td>
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{sub.Package?.name || 'Pacote'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{sub.startedAt ? new Date(sub.startedAt).toLocaleDateString('pt-PT') : '-'}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('pt-PT') : '-'}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{sub.autoRenew ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{parseFloat(sub.pricePaid).toFixed(2)} MZN</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminSubscriptions;
