import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function AdminWallets() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('walletName');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredWallets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return wallets
      .filter((wallet) => {
        const fields = [
          wallet.walletName || '',
          wallet.walletCode || '',
          wallet.User?.name || '',
          wallet.WalletType?.name || '',
          wallet.status || ''
        ];
        return !query || fields.join(' ').toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const left = String(a[sortBy] ?? '').toLowerCase();
        const right = String(b[sortBy] ?? '').toLowerCase();
        if (sortBy === 'balance') {
          return sortOrder === 'asc' ? Number(a.balance || 0) - Number(b.balance || 0) : Number(b.balance || 0) - Number(a.balance || 0);
        }
        if (left < right) return sortOrder === 'asc' ? -1 : 1;
        if (left > right) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [wallets, search, sortBy, sortOrder]);

  const setSortField = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder('asc');
  };
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    console.log('openMenuId changed:', openMenuId);
  }, [openMenuId]);

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
      notify({
        type: 'success',
        title: 'Sucesso',
        message: `Carteira ${wallet.walletCode} foi ${nextStatus === 'ACTIVE' ? 'ativada' : 'desativada'} com sucesso.`
      });
      await loadWallets();
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o estado da carteira.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const togglePermissionMenu = (walletId) => {
    console.log('togglePermissionMenu called for walletId:', walletId, 'current openMenuId:', openMenuId);
    setOpenMenuId((currentOpenMenuId) => (currentOpenMenuId === walletId ? null : walletId));
  };

  const updateWalletPermission = async (wallet, field, value) => {
    try {
      setPermissionLoading(wallet.id);
      await authRequest(`/api/wallets/${wallet.id}`, {
        method: 'PUT',
        body: { [field]: value }
      });
      notify({
        type: 'success',
        title: 'Sucesso',
        message: `Permissão ${field} atualizada para ${wallet.walletCode}.`
      });
      await loadWallets();
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar a permissão da carteira.'
      });
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


      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por carteira, utilizador, tipo ou estado"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Ordenar por:</span>
            <button
              type="button"
              onClick={() => setSortField('walletName')}
              className={`rounded-full px-3 py-2 transition ${sortBy === 'walletName' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Carteira
            </button>
            <button
              type="button"
              onClick={() => setSortField('balance')}
              className={`rounded-full px-3 py-2 transition ${sortBy === 'balance' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Saldo
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
              ) : filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhuma carteira encontrada.</td>
                </tr>
              ) : (
                filteredWallets.map((wallet) => (
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

                        <div className="relative inline-block text-left" ref={openMenuId === wallet.id ? menuRef : null}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              togglePermissionMenu(wallet.id);
                            }}
                            className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                          >
                            Permissões
                          </button>

                          {openMenuId === wallet.id && (
                            <div className="absolute right-0 z-50 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                              <div className="space-y-1 p-3">
                                <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                                  <span>C2B</span>
                                  <button
                                    type="button"
                                    onClick={() => updateWalletPermission(wallet, 'allowC2B', !wallet.allowC2B)}
                                    disabled={permissionLoading === wallet.id}
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${wallet.allowC2B ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                  >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${wallet.allowC2B ? 'translate-x-5' : 'translate-x-0'}`} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                                  <span>B2C</span>
                                  <button
                                    type="button"
                                    onClick={() => updateWalletPermission(wallet, 'allowB2C', !wallet.allowB2C)}
                                    disabled={permissionLoading === wallet.id}
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${wallet.allowB2C ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                  >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${wallet.allowB2C ? 'translate-x-5' : 'translate-x-0'}`} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                                  <span>Saque</span>
                                  <button
                                    type="button"
                                    onClick={() => updateWalletPermission(wallet, 'allowWithdraw', !wallet.allowWithdraw)}
                                    disabled={permissionLoading === wallet.id}
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${wallet.allowWithdraw ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                  >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${wallet.allowWithdraw ? 'translate-x-5' : 'translate-x-0'}`} />
                                  </button>
                                </div>
                              </div>
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
    </div>
  );
}

export default AdminWallets;
