import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';
import api from '../../services/api';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  inactive: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
};

const EXPIRES_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '365', label: '1 ano' },
  { value: 'never', label: 'Nunca expira' }
];

function formatDate(date) {
  if (!date) return 'Nunca expira';
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
}

function formatShortDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-PT');
}

function getStatus(key) {
  if (!key.isActive) return { key: 'inactive', label: 'Inativa' };
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
    return { key: 'expired', label: 'Expirada' };
  }
  return { key: 'active', label: 'Ativa' };
}

function renderTypeLogo(logo, provider) {
  const cls = 'h-8 w-8 rounded-lg object-contain';
  if (!logo) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {provider?.slice(0, 2)?.toUpperCase() || 'CT'}
      </div>
    );
  }
  if (typeof logo === 'string') return <img src={logo} alt={provider || 'Logo'} className={cls} />;
  return logo;
}

function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creationOpen, setCreationOpen] = useState(false);
  const [newTokenVisible, setNewTokenVisible] = useState(false);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const headingRef = useRef(null);
  const [newToken, setNewToken] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    scopes: [],
    walletIds: [],
    expiresIn: '30'
  });
  const [availableScopes, setAvailableScopes] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [kyc, setKyc] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const { authRequest } = useAuth();
  const { notify } = useNotification();

  const internalViewOpen =
    creationOpen || newTokenVisible || Boolean(confirmDeleteKey) || Boolean(selectedKey);

  useEffect(() => {
    if (internalViewOpen) headingRef.current?.focus();
  }, [internalViewOpen]);

  useEffect(() => {
    async function init() {
      const currentKyc = await loadKyc();
      if (currentKyc?.status === 'APPROVED') {
        await Promise.all([fetchApiKeys(), fetchAvailableScopes(), fetchWallets()]);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadKyc = async (silent = false) => {
    try {
      if (!silent) setKycLoading(true);
      const response = await authRequest('/api/kyc');
      const currentKyc = response?.kyc || null;
      setKyc(currentKyc);
      return currentKyc;
    } catch (error) {
      console.error('Erro ao carregar KYC:', error);
      if (!silent) setKyc(null);
      return null;
    } finally {
      if (!silent) setKycLoading(false);
    }
  };

  const fetchAvailableScopes = async (silent = false) => {
    try {
      const response = await api.get('/api/permissions');
      setAvailableScopes(
        (response.permissions || []).map((permission) => ({
          name: permission.name,
          label: permission.description || permission.name
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      if (!silent) {
        notify({
          type: 'error',
          title: 'Falha ao carregar permissões',
          message: 'Não foi possível carregar as permissões do servidor.'
        });
      }
    }
  };

  const fetchApiKeys = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/api/keys');
      const keys = response.apiKeys || [];
      setApiKeys(keys);
      setSelectedKey((current) =>
        current ? keys.find((k) => k.id === current.id) || current : null
      );
    } catch (error) {
      console.error('Erro ao carregar API Keys:', error);
      if (!silent) {
        notify({
          type: 'error',
          title: 'Falha ao listar chaves de acesso',
          message: 'Não foi possível carregar as chaves de acesso.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchWallets = async (silent = false) => {
    try {
      if (!silent) setWalletsLoading(true);
      const data = await authRequest('/api/wallets');
      setWallets(data || []);
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
      if (!silent) {
        notify({
          type: 'error',
          title: 'Falha ao carregar carteiras',
          message: 'Não foi possível carregar as suas carteiras.'
        });
      }
    } finally {
      if (!silent) setWalletsLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página.
  // O formulário de criação de chave e os modais abertos são preservados.
  useAutoRefresh(async () => {
    const currentKyc = await loadKyc(true);
    if (currentKyc?.status === 'APPROVED') {
      await Promise.all([fetchApiKeys(true), fetchAvailableScopes(true), fetchWallets(true)]);
    }
  });

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (creating) return;

    if (formData.walletIds.length === 0) {
      notify({
        type: 'error',
        title: 'Selecione uma carteira',
        message: 'Selecione pelo menos uma carteira para associar à chave de acesso.'
      });
      return;
    }

    try {
      setCreating(true);
      const expiresAt =
        formData.expiresIn === 'never'
          ? null
          : new Date(Date.now() + parseInt(formData.expiresIn, 10) * 24 * 60 * 60 * 1000);

      const response = await api.post('/api/keys', {
        name: formData.name,
        scopes: formData.scopes,
        walletIds: formData.walletIds,
        expiresAt
      });

      setNewToken(response.token || response.bearerToken);
      setCreationOpen(false);
      setNewTokenVisible(true);
      fetchApiKeys();
      setFormData({ name: '', scopes: [], walletIds: [], expiresIn: '30' });
    } catch (error) {
      console.error('Erro ao criar API Key:', error);
      notify({
        type: 'error',
        title: 'Falha ao criar chave de acesso',
        message: error?.message || 'Verifique os dados e tente novamente.'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/api/keys/${id}`, { isActive: !currentStatus });
      fetchApiKeys();
      notify({
        type: 'success',
        title: 'Status atualizado',
        message: currentStatus
          ? 'Chave de acesso desativada com sucesso.'
          : 'Chave de acesso ativada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      notify({
        type: 'error',
        title: 'Falha ao atualizar status',
        message: 'Não foi possível alterar o status da chave de acesso.'
      });
    }
  };

  const handleRenew = async (id) => {
    try {
      await api.patch(`/api/keys/${id}`, { action: 'renew' });
      fetchApiKeys();
      notify({
        type: 'success',
        title: 'Chave renovada',
        message: 'A chave de acesso foi renovada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao renovar API Key:', error);
      notify({
        type: 'error',
        title: 'Falha ao renovar chave de acesso',
        message: 'Tente novamente em alguns instantes.'
      });
    }
  };

  const handleDelete = (event, id, name) => {
    if (event) event.stopPropagation();
    setConfirmDeleteKey({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteKey || deleting) return;

    try {
      setDeleting(true);
      await api.delete(`/api/keys/${confirmDeleteKey.id}`);
      await fetchApiKeys();
      setSelectedKey(null);
      notify({
        type: 'success',
        title: 'Chave de acesso excluída',
        message: 'A chave de acesso foi removida com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir API Key:', error);
      notify({
        type: 'error',
        title: 'Falha ao excluir chave de acesso',
        message: 'Não foi possível excluir a chave de acesso.'
      });
    } finally {
      setConfirmDeleteKey(null);
      setDeleting(false);
    }
  };

  const copyToClipboard = (token) => {
    navigator.clipboard.writeText(token);
    notify({
      type: 'success',
      title: 'Copiado',
      message: 'Token copiado para a área de transferência.'
    });
  };

  const handleRowKeyDown = (event, key) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedKey(key);
    }
  };

  // ── Estados de KYC ────────────────────────────────────────────────────────
  if (kycLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          Carregando dados do KYC...
        </div>
      </div>
    );
  }

  if (kyc?.status !== 'APPROVED') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-rose-600">
            Atenção
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            KYC necessário
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Você precisa completar o KYC e ser aprovado antes de criar ou gerenciar chaves de
            acesso.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/client/kyc"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Ir para KYC
            </Link>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Após aprovação, terá acesso à criação de chaves.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Detalhe inline compacto ──────────────────────────────────────────────
  const KeyDetails = () => {
    if (!selectedKey) return null;
    const status = getStatus(selectedKey);
    const keyWallets = selectedKey.Wallets || [];
    const scopes = selectedKey.scopes || [];

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Chave selecionada
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {selectedKey.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedKey(null)}
            className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Voltar à lista
          </button>
        </div>

        <div className="max-w-xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
                  Chave de acesso
                </p>
                <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
                  {selectedKey.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKey(null)}
                className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Fechar detalhes"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 px-4 py-3">
              {/* Grid meta */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Estado</p>
                  <span
                    className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status.key]}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Criada em
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {formatShortDate(selectedKey.createdAt)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Expira em
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {selectedKey.expiresAt ? formatShortDate(selectedKey.expiresAt) : 'Nunca'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Último uso
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {selectedKey.lastUsedAt ? formatShortDate(selectedKey.lastUsedAt) : 'Nunca'}
                  </p>
                </div>
              </div>

              {/* Carteiras */}
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Carteiras ({keyWallets.length})
                </p>
                {keyWallets.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Nenhuma carteira associada.
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {keyWallets.map((w) => (
                      <span
                        key={w.id || w.walletCode}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {renderTypeLogo(
                          getWalletTypeLogo({
                            imageUrl: w.WalletType?.imageUrl,
                            code: w.WalletType?.code
                          }),
                          w.WalletType?.provider
                        )}
                        {w.walletName || w.walletCode}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Permissões */}
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Permissões ({scopes.length})
                </p>
                {scopes.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Nenhuma permissão atribuída.
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {scopes.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end dark:border-slate-700">
              <button
                type="button"
                onClick={(event) => handleDelete(event, selectedKey.id, selectedKey.name)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300"
              >
                Excluir
              </button>
              {selectedKey.expiresAt && new Date(selectedKey.expiresAt) < new Date() && (
                <button
                  type="button"
                  onClick={() => handleRenew(selectedKey.id)}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-300"
                >
                  Renovar
                </button>
              )}
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedKey.id, selectedKey.isActive)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {selectedKey.isActive ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!internalViewOpen && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Chaves de Acesso
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Gerencie suas chaves de acesso para conexões externas ao sistema
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreationOpen(true)}
              disabled={!walletsLoading && wallets.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Gerar nova chave
            </button>
          </div>

          {!walletsLoading && wallets.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              Você precisa ter pelo menos uma carteira criada para gerar uma chave de acesso.
            </div>
          )}

          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Minhas chaves
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Clique numa chave para ver detalhes e ações.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {apiKeys.length}
              </span>
            </div>

            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                A carregar chaves...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="py-10 text-center">
                <svg
                  className="mx-auto h-10 w-10 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma chave de acesso criada ainda
                </p>
                <button
                  type="button"
                  onClick={() => setCreationOpen(true)}
                  disabled={!walletsLoading && wallets.length === 0}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Criar primeira chave
                </button>
              </div>
            ) : (
              <>
                {/* Tabela (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Carteiras</th>
                        <th className="px-4 py-3">Último uso</th>
                        <th className="px-4 py-3">Expira em</th>
                        <th className="px-4 py-3">Criada em</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                      {apiKeys.map((key) => {
                        const status = getStatus(key);
                        return (
                          <tr
                            key={key.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedKey(key)}
                            onKeyDown={(event) => handleRowKeyDown(event, key)}
                            className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {key.name}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[status.key]}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {key.Wallets && key.Wallets.length > 0
                                ? key.Wallets.map((w) => w.walletName || w.walletCode).join(', ')
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {key.lastUsedAt ? formatShortDate(key.lastUsedAt) : 'Nunca'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {key.expiresAt ? formatShortDate(key.expiresAt) : 'Nunca'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {formatShortDate(key.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedKey(key);
                                }}
                                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards (mobile) */}
                <div className="md:hidden space-y-3">
                  {apiKeys.map((key) => {
                    const status = getStatus(key);
                    return (
                      <div
                        key={key.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedKey(key)}
                        onKeyDown={(event) => handleRowKeyDown(event, key)}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-white">
                              {key.name}
                            </p>
                            <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                              {key.Wallets?.length
                                ? key.Wallets.map((w) => w.walletName || w.walletCode).join(', ')
                                : 'Sem carteiras'}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[status.key]}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <div>
                            <span className="block uppercase tracking-wider">Expira</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {key.expiresAt ? formatShortDate(key.expiresAt) : 'Nunca'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block uppercase tracking-wider">Último uso</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {key.lastUsedAt ? formatShortDate(key.lastUsedAt) : 'Nunca'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedKey(key);
                            }}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                          >
                            Ver detalhes
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {selectedKey && <KeyDetails />}

      {creationOpen && (
        <section
          aria-labelledby="create-key-heading"
          className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
                Nova chave
              </p>
              <h2
                id="create-key-heading"
                ref={headingRef}
                tabIndex={-1}
                className="mt-1 text-base font-bold text-slate-900 dark:text-white"
              >
                Criar nova chave de acesso
              </h2>
            </div>
            <button
              type="button"
              disabled={creating}
              onClick={() => setCreationOpen(false)}
              className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ← Voltar
            </button>
          </div>

          <form onSubmit={handleCreateKey}>
            <fieldset disabled={creating} className="space-y-5">
              {/* Secção: Identificação */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Identificação
                </h3>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nome da chave <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: API Produção, API Teste"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </section>

              {/* Secção: Carteiras */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Carteiras <span className="text-rose-600">*</span>
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {formData.walletIds.length} selecionada
                    {formData.walletIds.length === 1 ? '' : 's'}
                  </span>
                </div>
                {wallets.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    Nenhuma carteira disponível.
                  </p>
                ) : (
                  <div role="group" aria-label="Carteiras" className="grid gap-2 sm:grid-cols-2">
                    {wallets.map((wallet) => {
                      const checked = formData.walletIds.includes(wallet.id);
                      return (
                        <label
                          key={wallet.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition ${
                            checked
                              ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  walletIds: [...prev.walletIds, wallet.id]
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  walletIds: prev.walletIds.filter((id) => id !== wallet.id)
                                }));
                              }
                            }}
                            className="sr-only"
                          />
                          {renderTypeLogo(
                            getWalletTypeLogo({
                              imageUrl: wallet.WalletType?.imageUrl,
                              code: wallet.WalletType?.code
                            }),
                            wallet.WalletType?.provider
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                              {wallet.walletName || wallet.walletCode}
                            </p>
                            <p className="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {wallet.walletCode}
                            </p>
                          </div>
                          {checked && (
                            <span className="shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              ✓
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Secção: Permissões */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Permissões
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {formData.scopes.length} selecionada{formData.scopes.length === 1 ? '' : 's'}
                  </span>
                </div>
                {availableScopes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    Nenhuma permissão disponível.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableScopes.map((scope) => {
                      const checked = formData.scopes.includes(scope.name);
                      return (
                        <button
                          key={scope.name}
                          type="button"
                          onClick={() => {
                            if (checked) {
                              setFormData((prev) => ({
                                ...prev,
                                scopes: prev.scopes.filter((s) => s !== scope.name)
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                scopes: [...prev.scopes, scope.name]
                              }));
                            }
                          }}
                          aria-pressed={checked}
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                            checked
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                          }`}
                          title={scope.name}
                        >
                          {scope.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Secção: Expiração */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Expiração
                </h3>
                <select
                  value={formData.expiresIn}
                  onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  {EXPIRES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </section>

              {/* Ações */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCreationOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? 'A gerar...' : 'Gerar chave'}
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}

      {confirmDeleteKey && (
        <section
          aria-labelledby="delete-key-heading"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-800"
        >
          <h2
            id="delete-key-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-bold text-slate-900 dark:text-white"
          >
            Confirmar exclusão
          </h2>
          <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Tem certeza que deseja excluir a chave{' '}
            <strong className="text-slate-900 dark:text-white">{confirmDeleteKey.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmDeleteKey(null)}
              disabled={deleting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? 'A excluir...' : 'Confirmar exclusão'}
            </button>
          </div>
        </section>
      )}

      {newTokenVisible && (
        <section
          aria-labelledby="generated-key-heading"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="mb-4 flex items-start gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2
                id="generated-key-heading"
                ref={headingRef}
                tabIndex={-1}
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Chave gerada com sucesso
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Esta é a única vez que o token será exibido.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-rose-50 px-3 py-2.5 dark:bg-rose-950/30">
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                Importante!
              </p>
              <p className="mt-1 text-[11px] text-rose-800 dark:text-rose-300">
                Copie o token e armazene-o em local seguro. Se o perder, precisará gerar uma nova
                chave.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Seu token de acesso
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {newToken}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newToken)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-sky-50 px-3 py-2.5 dark:bg-sky-950/30">
              <p className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                Como usar
              </p>
              <p className="mt-1 text-[11px] text-sky-800 dark:text-sky-300">
                Inclua o token no header das requisições:
              </p>
              <code className="mt-1 block rounded bg-white px-2 py-1 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Authorization: Bearer &lt;token&gt;
              </code>
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setNewTokenVisible(false);
                setNewToken(null);
              }}
              className="w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 sm:w-auto"
            >
              Guardei o token, voltar
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default ApiKeys;