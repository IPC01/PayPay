import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function AdminSubscriptions() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('startedAt');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscriptions
      .filter((sub) => {
        const fields = [
          sub.User?.name || '',
          sub.User?.email || '',
          sub.Package?.name || '',
          sub.status || ''
        ];
        return !query || fields.join(' ').toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const left = String(a[sortBy] ?? '').toLowerCase();
        const right = String(b[sortBy] ?? '').toLowerCase();

        if (sortBy === 'startedAt' || sortBy === 'expiresAt') {
          return sortOrder === 'asc'
            ? new Date(a[sortBy] || 0) - new Date(b[sortBy] || 0)
            : new Date(b[sortBy] || 0) - new Date(a[sortBy] || 0);
        }

        if (left < right) return sortOrder === 'asc' ? -1 : 1;
        if (left > right) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [subscriptions, search, sortBy, sortOrder]);

  const setSortField = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder('asc');
  };

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
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Gestão de Subscrições</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja e gerencie todas as subscrições da plataforma.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por utilizador, pacote, estado ou data"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setSortField('startedAt')}
              className={`rounded-full px-3 py-2 transition ${sortBy === 'startedAt' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Data de Início
            </button>
            <button
              type="button"
              onClick={() => setSortField('status')}
              className={`rounded-full px-3 py-2 transition ${sortBy === 'status' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Estado
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
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
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma subscrição encontrada.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
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
    </div>
  );
}

export default AdminSubscriptions;
