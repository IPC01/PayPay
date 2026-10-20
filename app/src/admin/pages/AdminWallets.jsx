import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { isAdmin } from '../../helpers/roles';
import AdminTransactions from './AdminTransactions';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN'
  });
}

function AdminWallets() {
  const { authRequest, user } = useAuth();
  const { notify } = useNotification();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('walletName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedWallet, setSelectedWallet] = useState(null);

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
        if (sortBy === 'balance') {
          return sortOrder === 'asc'
            ? Number(a.balance || 0) - Number(b.balance || 0)
            : Number(b.balance || 0) - Number(a.balance || 0);
        }
        const left = String(a[sortBy] ?? '').toLowerCase();
        const right = String(b[sortBy] ?? '').toLowerCase();
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

  const toggleWalletStatus = async (event, wallet) => {
    if (event) event.stopPropagation();
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
      setSelectedWallet((current) =>
        current && current.id === wallet.id ? { ...current, [field]: value } : current
      );
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

  const handleRowKeyDown = (event, wallet) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedWallet(wallet);
    }
  };

  // ── Detalhes da carteira (componente interno, compacto) ───────────────────
  const WalletDetailsCard = ({ wallet, onClose }) => {
    if (!wallet) return null;

    const PermissionToggle = ({ label, field, value }) => (
      <button
        type="button"
        onClick={() => updateWalletPermission(wallet, field, !value)}
        disabled={!isAdmin(user) || permissionLoading === wallet.id}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
          value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
        aria-label={`Alternar ${label}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    );

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
              Detalhes da Carteira
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
              {wallet.walletName || wallet.walletCode}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Fechar detalhes"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="space-y-3 px-4 py-3">
          {/* Saldo destacado */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Saldo</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(wallet.balance)}
            </p>
          </div>

          {/* Grid 2x2 de informação */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Código</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                {wallet.walletCode || 'N/A'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Estado</p>
              <p
                className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  wallet.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                }`}
              >
                {wallet.status}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Utilizador</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                {wallet.User?.name || 'Sem utilizador'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Tipo</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                {wallet.WalletType?.name || 'Desconhecido'}
              </p>
            </div>
          </div>

          {/* Permissões compactas */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Permissões</p>
            <div className="mt-2 space-y-1.5">
              {[
                { label: 'C2B', field: 'allowC2B', value: wallet.allowC2B },
                { label: 'B2C', field: 'allowB2C', value: wallet.allowB2C },
                { label: 'Saque', field: 'allowWithdraw', value: wallet.allowWithdraw }
              ].map((perm) => (
                <div
                  key={perm.field}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <span>{perm.label}</span>
                  <PermissionToggle {...perm} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Gestão de Carteiras
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja todas as carteiras registadas e o seu estado atual.
          </p>
        </div>
      </div>

      {selectedWallet ? (
        <div className="min-w-0 space-y-4">
          {/* Barra de contexto com voltar */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Carteira selecionada</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {selectedWallet.walletName || selectedWallet.walletCode} ·{' '}
                {selectedWallet.User?.name || 'Sem utilizador'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWallet(null)}
              className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ← Voltar à lista
            </button>
          </div>

          {/* Detalhes compactos inline (largura limitada em ecrãs grandes) */}
          <div className="max-w-xl">
            <WalletDetailsCard wallet={selectedWallet} onClose={() => setSelectedWallet(null)} />
          </div>

          {/* Transações abaixo */}
          <AdminTransactions key={selectedWallet.id} wallet={selectedWallet} />
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por carteira, utilizador, tipo ou estado"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Ordenar por:</span>
              {[
                { key: 'walletName', label: 'Carteira' },
                { key: 'balance', label: 'Saldo' },
                { key: 'status', label: 'Estado' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortField(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    sortBy === key
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">A carregar carteiras...</div>
          ) : filteredWallets.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">Nenhuma carteira encontrada.</div>
          ) : (
            <>
              {/* Tabela (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Carteira</th>
                      <th className="px-6 py-4">Utilizador</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Saldo</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-700 dark:bg-slate-800">
                    {filteredWallets.map((wallet) => (
                      <tr
                        key={wallet.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedWallet(wallet)}
                        onKeyDown={(event) => handleRowKeyDown(event, wallet)}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {wallet.walletName || wallet.walletCode}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {wallet.User?.name || 'Sem utilizador'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {wallet.WalletType?.name || 'Desconhecido'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {formatCurrency(wallet.balance)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              wallet.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                            }`}
                          >
                            {wallet.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWallet(wallet);
                              }}
                              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={(e) => toggleWalletStatus(e, wallet)}
                              disabled={
                                actionLoading === wallet.id ||
                                wallet.status === 'CLOSED' ||
                                (!isAdmin(user) && wallet.User?.Role?.name !== 'user')
                              }
                              className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                wallet.status === 'ACTIVE'
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {actionLoading === wallet.id
                                ? 'A processar...'
                                : wallet.status === 'ACTIVE'
                                  ? 'Desativar'
                                  : 'Ativar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {filteredWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedWallet(wallet)}
                    onKeyDown={(event) => handleRowKeyDown(event, wallet)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {wallet.walletName || wallet.walletCode}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {wallet.User?.name || 'Sem utilizador'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          wallet.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                        }`}
                      >
                        {wallet.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Tipo</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {wallet.WalletType?.name || 'Desconhecido'}
                        </span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider">Saldo</span>
                        <span className="text-slate-700 dark:text-slate-300">{formatCurrency(wallet.balance)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWallet(wallet);
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        Detalhes
                      </button>
                      <button
                        type="button"
                        onClick={(e) => toggleWalletStatus(e, wallet)}
                        disabled={
                          actionLoading === wallet.id ||
                          wallet.status === 'CLOSED' ||
                          (!isAdmin(user) && wallet.User?.Role?.name !== 'user')
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          wallet.status === 'ACTIVE'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {actionLoading === wallet.id
                          ? 'A processar...'
                          : wallet.status === 'ACTIVE'
                            ? 'Desativar'
                            : 'Ativar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminWallets;