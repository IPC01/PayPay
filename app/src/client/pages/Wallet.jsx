import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';
import Transactions from './Transactions';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  INACTIVE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
};

const STATUS_LABELS = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa'
};

const inputClasses =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

const inputMonoClasses =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2
  });
}

function getCurrencySymbol(curr) {
  const symbols = { MZN: 'MT', USD: '$', EUR: '€' };
  return symbols[curr] || curr;
}

function getStatusBadge(status) {
  const s = String(status).toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        STATUS_STYLES[s] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
      }`}
    >
      {STATUS_LABELS[s] || status}
    </span>
  );
}

function renderTypeLogo(imageUrl, provider) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={provider || 'Tipo de carteira'}
        className="h-8 w-8 rounded-lg object-contain"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
      {provider?.slice(0, 2) || 'CT'}
    </div>
  );
}

// ── Componentes movidos para fora para evitar remount a cada render ──────

const WalletForm = ({
  formData,
  setFormData,
  walletTypes,
  selectedWalletType,
  selectedWalletTypeLogo,
  handleCreate,
  isSubmitting,
  setFormOpen
}) => (
  <div className="space-y-4">
    {/* Barra de contexto */}
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Nova carteira
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
          Criar nova carteira
        </p>
      </div>
      <button
        type="button"
        onClick={() => setFormOpen(false)}
        className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        ← Voltar à lista
      </button>
    </div>

    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
              Carteira
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
              Criar nova carteira
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Preencha os dados para criar uma nova carteira
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Fechar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreate}>
          <div className="space-y-3 px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tipo de carteira <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                {renderTypeLogo(selectedWalletTypeLogo, selectedWalletType?.provider)}
                <select
                  value={formData.walletTypeId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, walletTypeId: e.target.value }))
                  }
                  required
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white"
                >
                  {walletTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} — {type.provider}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome da carteira <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={formData.walletName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, walletName: e.target.value }))
                }
                placeholder="Ex: Minha Carteira Principal"
                required
                className={inputClasses}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Referência <span className="text-slate-400">(opcional, até 8 caracteres)</span>
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reference: e.target.value
                      .replace(/[^A-Za-z0-9]/g, '')
                      .toUpperCase()
                      .slice(0, 8)
                  }))
                }
                maxLength={8}
                placeholder="Ex: LOJA123"
                className={inputMonoClasses}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Usada como referência inicial nas transações desta carteira; o sistema acrescenta
                um código aleatório de 12 caracteres para garantir que nunca se repete.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Moeda
              </label>
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {selectedWalletType?.currency || 'MZN'} — definida pelo tipo de carteira
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-3 sm:flex-row sm:justify-end dark:border-slate-700">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.walletName || !formData.walletTypeId}
              className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Criando...' : 'Criar carteira'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

const WalletDetails = ({
  selectedWallet,
  auditLogs,
  auditLoading,
  showAudit,
  setShowAudit,
  openEditWallet,
  closeWalletDetails
}) => {
  if (!selectedWallet) return null;

  return (
    <div className="space-y-4">
      {/* Barra de contexto */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Carteira selecionada
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
            {selectedWallet.walletName} · {selectedWallet.walletCode}
          </p>
        </div>
        <button
          type="button"
          onClick={closeWalletDetails}
          className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← Voltar à lista
        </button>
      </div>

      <div className="w-full">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
                Carteira
              </p>
              <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
                {selectedWallet.walletName}
              </h2>
              <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                {selectedWallet.walletCode}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={openEditWallet}
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Editar carteira"
                title="Editar nome e referência"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={closeWalletDetails}
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Fechar detalhes"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Corpo */}
          <div className="space-y-3 px-4 py-3">
            <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Saldo</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(selectedWallet.balance || 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Moeda</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-white">
                  {getCurrencySymbol(selectedWallet.currency)} {selectedWallet.currency}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Estado</p>
                <div className="mt-0.5">{getStatusBadge(selectedWallet.status)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900 col-span-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Referência
                </p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedWallet.reference || '—'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900 col-span-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Tipo</p>
                <div className="mt-1 flex items-center gap-2">
                  {renderTypeLogo(
                    getWalletTypeLogo({
                      imageUrl: selectedWallet.WalletType?.imageUrl,
                      code: selectedWallet.WalletType?.code
                    }),
                    selectedWallet.WalletType?.provider
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {selectedWallet.WalletType?.name || 'N/A'}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedWallet.WalletType?.provider || 'Sem provedor'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Atividades colapsáveis */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowAudit((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>
                  Atividades recentes{' '}
                  {auditLoading ? '· a carregar...' : `(${auditLogs.length})`}
                </span>
                <span>{showAudit ? '−' : '+'}</span>
              </button>
              {showAudit && (
                <div className="space-y-2 border-t border-slate-200 px-3 py-2 dark:border-slate-700">
                  {auditLoading ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Carregando...</p>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nenhuma atividade recente.
                    </p>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[11px] font-semibold text-slate-900 dark:text-white">
                            {log.action}
                          </p>
                          <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(log.createdAt).toLocaleString('pt-PT')}
                          </span>
                        </div>
                        {log.description && (
                          <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {log.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transações da carteira */}
      <Transactions key={selectedWallet.id} wallet={selectedWallet} />
    </div>
  );
};

function Wallets() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [wallets, setWallets] = useState([]);
  const [walletTypes, setWalletTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [formData, setFormData] = useState({
    walletName: '',
    walletTypeId: '',
    reference: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kyc, setKyc] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ walletName: '', reference: '' });
  const [editSaving, setEditSaving] = useState(false);

  async function loadKyc(silent = false) {
    try {
      if (!silent) setKycLoading(true);
      const data = await authRequest('/api/kyc');
      const currentKyc = data?.kyc || null;
      setKyc(currentKyc);
      return currentKyc;
    } catch (err) {
      console.error(err);
      if (!silent) setKyc(null);
      return null;
    } finally {
      if (!silent) setKycLoading(false);
    }
  }

  async function loadSubscriptionStatus(silent = false) {
    try {
      if (!silent) setSubscriptionLoading(true);
      const subscriptions = await authRequest('/api/subscriptions');
      const active = (subscriptions || []).some(
        (sub) => sub.status === 'active' && new Date(sub.expiresAt) > new Date()
      );
      setHasActivePackage(active);
      return active;
    } catch (err) {
      console.error(err);
      if (!silent) setHasActivePackage(false);
      return false;
    } finally {
      if (!silent) setSubscriptionLoading(false);
    }
  }

  useEffect(() => {
    async function prepare() {
      await authRequest('/api/audit/events', {
        method: 'POST',
        body: { action: 'view_wallets_page', entity: 'Wallet', entityId: null }
      }).catch(() => {});

      const currentKyc = await loadKyc();
      if (currentKyc?.status === 'APPROVED') {
        await Promise.all([loadData(), loadSubscriptionStatus()]);
      } else {
        setLoading(false);
      }
    }
    prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fechar formulário inline com ESC
  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e) => e.key === 'Escape' && setFormOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [formOpen]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [walletsData, typesData] = await Promise.all([
        authRequest('/api/wallets'),
        authRequest('/api/wallet-types')
      ]);
      setWallets(walletsData);
      const activeTypes = typesData.filter((type) => type.status);
      setWalletTypes(activeTypes);
      if (activeTypes.length > 0) {
        setFormData((prev) =>
          prev.walletTypeId ? prev : { ...prev, walletTypeId: String(activeTypes[0].id) }
        );
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        notify({
          type: 'error',
          title: 'Erro ao carregar dados',
          message: 'Não foi possível carregar as carteiras.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useAutoRefresh(async () => {
    const currentKyc = await loadKyc(true);
    if (currentKyc?.status === 'APPROVED') {
      await Promise.all([loadData(true), loadSubscriptionStatus(true)]);
    }
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await authRequest('/api/wallets', {
        method: 'POST',
        body: {
          walletName: formData.walletName,
          walletTypeId: formData.walletTypeId,
          reference: formData.reference
        }
      });
      notify({
        type: 'success',
        title: 'Carteira criada',
        message: `Carteira ${data.wallet.walletCode} criada com sucesso!`
      });
      setFormOpen(false);
      setFormData({ walletName: '', walletTypeId: walletTypes[0]?.id || '', reference: '' });
      loadData();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao criar carteira',
        message: err.message || 'Não foi possível criar a carteira.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadAuditLogs = async (walletId) => {
    try {
      setAuditLoading(true);
      const logs = await authRequest(`/api/audit?entity=Wallet&entityId=${walletId}`);
      setAuditLogs(logs.slice(0, 5));
    } catch (err) {
      console.error(err);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const openWalletDetails = async (event, wallet) => {
    if (event) event.stopPropagation();
    setSelectedWallet(wallet);
    setShowAudit(false);
    await loadAuditLogs(wallet.id);
  };

  const closeWalletDetails = () => {
    setSelectedWallet(null);
    setAuditLogs([]);
    setShowAudit(false);
  };

  const openEditWallet = () => {
    if (!selectedWallet) return;
    setEditData({
      walletName: selectedWallet.walletName || '',
      reference: selectedWallet.reference || ''
    });
    setEditOpen(true);
  };

  const closeEditWallet = () => setEditOpen(false);

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!selectedWallet || editSaving) return;
    try {
      setEditSaving(true);
      const data = await authRequest(`/api/wallets/${selectedWallet.id}`, {
        method: 'PUT',
        body: {
          walletName: editData.walletName.trim(),
          reference: editData.reference
        }
      });
      notify({
        type: 'success',
        title: 'Carteira atualizada',
        message: 'O nome e a referência da carteira foram atualizados.'
      });
      setEditOpen(false);
      setSelectedWallet((current) => (current ? { ...current, ...data.wallet } : current));
      await loadData(true);
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao atualizar carteira',
        message: err.message || 'Não foi possível atualizar a carteira.'
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleRowKeyDown = (event, wallet) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openWalletDetails(null, wallet);
    }
  };

  const selectedWalletType = walletTypes.find(
    (type) => String(type.id) === formData.walletTypeId
  );
  const selectedWalletTypeLogo = getWalletTypeLogo({
    imageUrl: selectedWalletType?.imageUrl,
    code: selectedWalletType?.code
  });

  // ── Estados de carregamento / KYC ────────────────────────────────────────
  if (loading || kycLoading) {
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
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-rose-600">
            Atenção
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            KYC necessário
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Você precisa completar o processo de KYC e aguardar a aprovação antes de acessar
            suas carteiras.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/client/kyc"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Completar KYC
            </a>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Após aprovação, as carteiras serão liberadas.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);
  const activeWallets = wallets.filter(
    (wallet) => String(wallet.status).toUpperCase() === 'ACTIVE'
  ).length;

  // ── Render principal ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
            Gerenciamento de Carteiras
          </p>
        </div>
        {!formOpen && !selectedWallet && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            disabled={!subscriptionLoading && !hasActivePackage}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Carteira
          </button>
        )}
      </div>

      {!subscriptionLoading && !hasActivePackage && !formOpen && !selectedWallet && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          Você precisa subscrever um pacote para poder criar carteiras.{' '}
          <a href="/client/packages" className="font-semibold underline">
            Ver pacotes disponíveis
          </a>
        </div>
      )}

      {/* Cards de Estatísticas — só na lista */}
      {!formOpen && !selectedWallet && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Total de Carteiras',
              value: wallets.length,
              color: 'blue',
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              )
            },
            {
              label: 'Ativas',
              value: activeWallets,
              color: 'emerald',
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )
            },
            {
              label: 'Saldo Total',
              value: formatCurrency(totalBalance),
              color: 'purple',
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )
            },
            {
              label: 'Tipos',
              value: walletTypes.length,
              color: 'orange',
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                />
              )
            }
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-1 truncate text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`shrink-0 rounded-lg bg-${card.color}-100 p-2 dark:bg-${card.color}-900/30`}
                >
                  <svg
                    className={`h-5 w-5 text-${card.color}-600 dark:text-${card.color}-400`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {card.icon}
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen ? (
        <WalletForm
          formData={formData}
          setFormData={setFormData}
          walletTypes={walletTypes}
          selectedWalletType={selectedWalletType}
          selectedWalletTypeLogo={selectedWalletTypeLogo}
          handleCreate={handleCreate}
          isSubmitting={isSubmitting}
          setFormOpen={setFormOpen}
        />
      ) : selectedWallet ? (
        <WalletDetails
          selectedWallet={selectedWallet}
          auditLogs={auditLogs}
          auditLoading={auditLoading}
          showAudit={showAudit}
          setShowAudit={setShowAudit}
          openEditWallet={openEditWallet}
          closeWalletDetails={closeWalletDetails}
        />
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Minhas carteiras
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Clique numa carteira para ver detalhes e transações.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {wallets.length}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              A carregar carteiras...
            </div>
          ) : wallets.length === 0 ? (
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
                  d="M3 10h18M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Nenhuma carteira encontrada
              </p>
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                disabled={!subscriptionLoading && !hasActivePackage}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Criar primeira carteira
              </button>
            </div>
          ) : (
            <>
              {/* Tabela (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Carteira</th>
                      <th className="px-4 py-3">Saldo</th>
                      <th className="px-4 py-3">Moeda</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                    {wallets.map((wallet) => (
                      <tr
                        key={wallet.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openWalletDetails(null, wallet)}
                        onKeyDown={(event) => handleRowKeyDown(event, wallet)}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                      >
                        <td className="px-4 py-3">
                          <div className="flex min-w-[200px] items-center gap-3">
                            {renderTypeLogo(
                              getWalletTypeLogo({
                                imageUrl: wallet.WalletType?.imageUrl,
                                code: wallet.WalletType?.code
                              }),
                              wallet.WalletType?.provider
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {wallet.walletName}
                              </p>
                              <p className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {wallet.walletCode}
                              </p>
                              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {wallet.WalletType?.name || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(wallet.balance || 0)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            {getCurrencySymbol(wallet.currency)} {wallet.currency}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {getStatusBadge(wallet.status)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(event) => openWalletDetails(event, wallet)}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openWalletDetails(null, wallet)}
                    onKeyDown={(event) => handleRowKeyDown(event, wallet)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {renderTypeLogo(
                          getWalletTypeLogo({
                            imageUrl: wallet.WalletType?.imageUrl,
                            code: wallet.WalletType?.code
                          }),
                          wallet.WalletType?.provider
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">
                            {wallet.walletName}
                          </p>
                          <p className="truncate font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {wallet.walletCode}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(wallet.status)}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Saldo</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(wallet.balance || 0)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Moeda</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {getCurrencySymbol(wallet.currency)} {wallet.currency}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={(event) => openWalletDetails(event, wallet)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Editar Carteira */}
      {editOpen && selectedWallet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm"
          onClick={closeEditWallet}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Editar carteira
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Apenas o nome e a referência podem ser alterados
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditWallet}
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Fechar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="space-y-3 px-5 py-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nome da carteira <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editData.walletName}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, walletName: e.target.value }))
                    }
                    placeholder="Ex: Minha Carteira Principal"
                    required
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Referência <span className="text-slate-400">(opcional, até 8 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    value={editData.reference}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        reference: e.target.value
                          .replace(/[^A-Za-z0-9]/g, '')
                          .toUpperCase()
                          .slice(0, 8)
                      }))
                    }
                    maxLength={8}
                    placeholder="Ex: LOJA123"
                    className={inputMonoClasses}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Usada como referência inicial nas transações desta carteira; o sistema
                    acrescenta um código aleatório de 12 caracteres para garantir que nunca se
                    repete.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-3 sm:flex-row sm:justify-end dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeEditWallet}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSaving || !editData.walletName.trim()}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editSaving ? 'Guardando...' : 'Guardar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallets;