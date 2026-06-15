import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminWallets() {
  const { authRequest } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/wallets');
      setWallets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWalletStatus = async (wallet) => {
    const nextStatus = wallet.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';

    try {
      setActionLoading(wallet.id);
      await authRequest(`/api/wallets/${wallet.id}/status`, {
        method: 'PUT',
        body: { status: nextStatus }
      });
      setFeedback(`Carteira ${wallet.walletCode} foi ${nextStatus === 'ACTIVE' ? 'ativada' : 'desativada'} com sucesso.`);
      await loadWallets();
    } catch (err) {
      console.error(err);
      setFeedback('Não foi possível atualizar o estado da carteira.');
    } finally {
      setActionLoading(null);
    }
  };

  const togglePermissionMenu = (walletId) => {
    setOpenMenuId(openMenuId === walletId ? null : walletId);
  };

  const updateWalletPermission = async (wallet, field, value) => {
    try {
      setPermissionLoading(wallet.id);
      await authRequest(`/api/wallets/${wallet.id}`, {
        method: 'PUT',
        body: { [field]: value }
      });
      setFeedback(`Permissão ${field} atualizada para ${wallet.walletCode}.`);
      setOpenMenuId(null);
      await loadWallets();
    } catch (err) {
      console.error(err);
      setFeedback('Não foi possível atualizar a permissão da carteira.');
    } finally {
      setPermissionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Gestão de Carteiras</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja todas as carteiras registadas e o seu estado atual.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-100">
          {feedback}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Carteira</th>
              <th className="px-6 py-4">Utilizador</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Saldo</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-700 dark:bg-slate-800">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar carteiras...</td>
              </tr>
            ) : wallets.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhuma carteira encontrada.</td>
              </tr>
            ) : (
              wallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{wallet.walletName || wallet.walletCode}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{wallet.User?.name || 'Sem utilizador'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{wallet.WalletType?.name || 'Desconhecido'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{Number(wallet.balance || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${wallet.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'}`}>
                      {wallet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/wallets/${wallet.id}`}
                        className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        Ver
                      </Link>

                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => togglePermissionMenu(wallet.id)}
                          className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                        >
                          Permissões
                        </button>

                        {openMenuId === wallet.id && (
                          <div className="absolute right-0 z-20 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => updateWalletPermission(wallet, 'allowC2B', !wallet.allowC2B)}
                              disabled={permissionLoading === wallet.id}
                              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              C2B: {wallet.allowC2B ? 'Ativo' : 'Desativado'}
                            </button>
                            <button
                              type="button"
                              onClick={() => updateWalletPermission(wallet, 'allowB2C', !wallet.allowB2C)}
                              disabled={permissionLoading === wallet.id}
                              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              B2C: {wallet.allowB2C ? 'Ativo' : 'Desativado'}
                            </button>
                            <button
                              type="button"
                              onClick={() => updateWalletPermission(wallet, 'allowWithdraw', !wallet.allowWithdraw)}
                              disabled={permissionLoading === wallet.id}
                              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Saque: {wallet.allowWithdraw ? 'Ativo' : 'Desativado'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleWalletStatus(wallet)}
                      disabled={actionLoading === wallet.id || wallet.status === 'CLOSED'}
                      className={`inline-flex rounded-xl px-3 py-2 text-xs font-semibold text-white transition ${wallet.status === 'ACTIVE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} ${wallet.status === 'CLOSED' ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      {actionLoading === wallet.id ? 'A processar...' : wallet.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                    </button>
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

export default AdminWallets;
