import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminDashboard() {
  const { authRequest } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/stats');
      setStats(data);
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
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Painel de Gestão</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Monitorize utilizadores, carteiras e transações no sistema.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/users" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Ver utilizadores
          </Link>
          <Link to="/admin/wallets" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
            Ver carteiras
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Utilizadores</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : stats?.userCount ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carteiras</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : stats?.walletCount ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Transações</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : stats?.transactionCount ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carteiras ativas</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : stats?.activeWalletCount ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ações rápidas</h2>
          <div className="mt-5 space-y-3">
            <Link
              to="/admin/users"
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-brand-500"
            >
              Revisar lista de utilizadores
            </Link>
            <Link
              to="/admin/wallets"
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-brand-500"
            >
              Revisar carteiras e estados
            </Link>
            <Link
              to="/admin/transactions"
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-brand-500"
            >
              Ver histórico de transações
            </Link>
            <Link
              to="/admin/tickets"
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-brand-500"
            >
              Ver tickets de suporte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
