import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
};

const STATUS_LABELS = {
  pending: 'Em confirmação',
  approved: 'Concluído',
  rejected: 'Não realizado'
};

function formatCurrency(value, currency = 'MZN') {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(
    Number(value || 0)
  );
}

const renderTypeLogo = (logo, provider) => {
  const cls = 'h-9 w-9 rounded-lg object-contain';
  if (!logo) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {provider?.slice(0, 2)?.toUpperCase() || 'CT'}
      </div>
    );
  }
  if (typeof logo === 'string') {
    return <img src={logo} alt={provider || 'Logo'} className={cls} />;
  }
  return logo;
};

function Withdrawals() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ walletId: '', amount: '', phone: '', note: '' });
  const headingRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (withdrawalOpen) headingRef.current?.focus();
  }, [withdrawalOpen]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [withdrawals, walletsData] = await Promise.all([
        authRequest('/api/withdrawals'),
        authRequest('/api/wallets')
      ]);

      setRequests(withdrawals);
      const availableWallets = walletsData.filter(
        (wallet) =>
          wallet.status === 'ACTIVE' &&
          wallet.allowWithdraw !== false &&
          wallet.allowB2C !== false &&
          wallet.WalletType?.code?.toLowerCase() === 'mpesa'
      );
      setWallets(availableWallets);

      const queryWalletId = searchParams.get('walletId');
      const selectedWallet = availableWallets.find((wallet) => wallet.id === queryWalletId);
      setForm((prev) => {
        // A carteira da URL só é aplicada no carregamento inicial, não na sincronização
        if (!silent && selectedWallet) return { ...prev, walletId: selectedWallet.id };
        if (!prev.walletId && availableWallets.length > 0) {
          return { ...prev, walletId: availableWallets[0].id };
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
      if (!silent) {
        notify({
          type: 'error',
          title: 'Erro ao carregar saques',
          message: err.message || 'Não foi possível carregar os pedidos de saque.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página.
  // O formulário de saque (carteira, valor, telefone, nota) é preservado.
  useAutoRefresh(() => loadData(true));

  const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');

  const getLocalPhone = (phone) => {
    let digits = normalizePhone(phone);
    if (digits.startsWith('258')) digits = digits.slice(3);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    return digits;
  };

  const selectedWallet = wallets.find((wallet) => wallet.id === form.walletId);
  const walletTypeCode =
    selectedWallet?.WalletType?.code || selectedWallet?.WalletType?.name || '';
  const withdrawalFeePercent = Number(settings?.withdrawalFeePercent) || 0;
  const withdrawalMinValue = Number(settings?.withdrawalMinValue) || 0;
  const withdrawalMaxValue = Number(settings?.withdrawalMaxValue) || 0;
  const currentBalance = Number(selectedWallet?.balance) || 0;
  const requestedAmount = Number(form.amount || 0);
  // Taxa da plataforma em percentagem, retida sobre o valor do saque
  const feeAmount =
    requestedAmount > 0 ? Number(((requestedAmount * withdrawalFeePercent) / 100).toFixed(2)) : 0;
  const totalRequired =
    requestedAmount > 0 ? Number((requestedAmount + feeAmount).toFixed(2)) : 0;

  const validatePhone = () => {
    const phone = getLocalPhone(form.phone);
    if (phone.length !== 9) return false;
    const lowerCode = String(walletTypeCode).toLowerCase();
    if (lowerCode.includes('mpesa')) return /^(84|85)\d{7}$/.test(phone);
    if (lowerCode.includes('emola')) return /^(86|87)\d{7}$/.test(phone);
    if (lowerCode.includes('mkesh')) return /^(82|83)\d{7}$/.test(phone);
    return true;
  };

  const phoneError = () => {
    if (!form.phone) return '';
    if (validatePhone()) return '';
    const lower = walletTypeCode.toLowerCase();
    if (lower.includes('mpesa')) {
      return 'Número inválido. Use prefixo 84 ou 85 com 9 dígitos locais.';
    }
    if (lower.includes('emola')) {
      return 'Número inválido. Use prefixo 86 ou 87 com 9 dígitos locais.';
    }
    if (lower.includes('mkesh')) {
      return 'Número inválido. Use prefixo 82 ou 83 com 9 dígitos locais.';
    }
    return 'Número de telefone inválido para esta carteira.';
  };

  const amountError = () => {
    if (!form.amount) return '';
    if (requestedAmount <= 0) return 'O valor deve ser maior que zero.';
    if (withdrawalMinValue > 0 && requestedAmount < withdrawalMinValue) {
      return `O valor mínimo de saque é ${withdrawalMinValue.toFixed(2)}.`;
    }
    if (withdrawalMaxValue > 0 && requestedAmount > withdrawalMaxValue) {
      return `O valor máximo de saque é ${withdrawalMaxValue.toFixed(2)}.`;
    }
    if (currentBalance < totalRequired) {
      return `Saldo insuficiente. Total requerido é ${formatCurrency(
        totalRequired,
        selectedWallet?.currency || 'MZN'
      )}.`;
    }
    return '';
  };

  const amountValidationMessage = amountError();
  const phoneValidationMessage = phoneError();

  const openWithdrawal = () => setWithdrawalOpen(true);
  const closeWithdrawal = () => setWithdrawalOpen(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!form.walletId || !form.amount || !form.phone) {
      notify({
        type: 'error',
        title: 'Dados obrigatórios',
        message: 'Informe a carteira, o valor e o telefone para solicitar o saque.'
      });
      return;
    }
    if (amountValidationMessage) {
      notify({ type: 'error', title: 'Valor inválido', message: amountValidationMessage });
      return;
    }
    if (phoneValidationMessage) {
      notify({ type: 'error', title: 'Telefone inválido', message: phoneValidationMessage });
      return;
    }

    try {
      setSubmitting(true);
      const result = await authRequest('/api/withdrawals', {
        method: 'POST',
        body: {
          walletId: form.walletId,
          amount: Number(form.amount),
          phone: form.phone,
          note: form.note
        }
      });

      notify({
        type: result.pending ? 'warning' : 'success',
        title: result.pending ? 'Saque em confirmação' : 'Saque concluído',
        message: result.pending
          ? `${result.message} Referência: ${result.reference}. O saldo está reservado; não repita o saque.`
          : `O M-Pesa confirmou a transferência B2C. Referência: ${result.reference}.`
      });

      setForm({ walletId: form.walletId, amount: '', phone: '', note: '' });
      closeWithdrawal();
      await loadData();
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Falha ao solicitar saque',
        message: err.message || 'Não foi possível enviar o pedido de saque.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const requestCount = requests.length;
  const summary = useMemo(
    () => ({
      pending: requests.filter((item) => item.status === 'pending').length,
      approved: requests.filter((item) => item.status === 'approved').length,
      rejected: requests.filter((item) => item.status === 'rejected').length
    }),
    [requests]
  );

  // ── Card de carteira selecionável ────────────────────────────────────────
  const WalletOption = ({ wallet, isSelected, onSelect }) => (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => onSelect(wallet.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(wallet.id);
        }
      }}
      className={`cursor-pointer rounded-xl border p-3 transition focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
        isSelected
          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-900/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        {renderTypeLogo(
          getWalletTypeLogo({
            imageUrl: wallet.WalletType?.imageUrl,
            code: wallet.WalletType?.code
          }),
          wallet.WalletType?.provider
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {wallet.walletName || wallet.walletCode}
          </p>
          <p className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {wallet.walletCode}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            {formatCurrency(wallet.balance, wallet.currency || 'MZN')}
          </p>
          {isSelected && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Selecionada
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // ── Vista: lista de saques ───────────────────────────────────────────────
  if (!withdrawalOpen) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
              Saques
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Seus saques
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Transfira o saldo disponível para um número M-Pesa via B2C, sem aprovação
              administrativa.
            </p>
          </div>
          <button
            type="button"
            onClick={openWithdrawal}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Levantar saldo
          </button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            { label: 'Total', value: requestCount, color: 'slate' },
            { label: 'Em confirmação', value: summary.pending, color: 'amber' },
            { label: 'Processado', value: summary.approved, color: 'emerald' }
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-800"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {card.label}
              </p>
              <p
                className={`mt-1 text-2xl font-bold text-${card.color}-700 dark:text-${card.color}-300 sm:text-3xl`}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Histórico
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Todos os pedidos de saque com referência única.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {requestCount}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              A carregar pedidos de saque...
            </div>
          ) : requestCount === 0 ? (
            <div className="py-10 text-center">
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                Nenhum saque encontrado.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Use "Levantar saldo" para fazer o seu primeiro saque.
              </p>
            </div>
          ) : (
            <>
              {/* Tabela (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Carteira</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Taxa</th>
                      <th className="px-4 py-3">Telefone</th>
                      <th className="px-4 py-3">Referência</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Resposta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {request.Wallet?.walletName || request.Wallet?.walletCode || '—'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {request.Wallet?.currency || 'MZN'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(request.amount, request.Wallet?.currency)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatCurrency(request.fee || 0, request.Wallet?.currency)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {request.phone}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {request.reference || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_STYLES[request.status] ||
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {STATUS_LABELS[request.status] || request.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                          {new Date(request.createdAt).toLocaleString('pt-PT')}
                        </td>
                        <td className="max-w-[220px] px-4 py-3 text-slate-500 dark:text-slate-400">
                          <span className="line-clamp-2">{request.adminMessage || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {request.Wallet?.walletName || request.Wallet?.walletCode || '—'}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {request.phone}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          STATUS_STYLES[request.status] ||
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {STATUS_LABELS[request.status] || request.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Valor</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(request.amount, request.Wallet?.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider">Taxa</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(request.fee || 0, request.Wallet?.currency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Data</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(request.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      {request.reference && (
                        <div className="col-span-2">
                          <span className="block uppercase tracking-wider">Referência</span>
                          <span className="break-all font-mono text-slate-700 dark:text-slate-300">
                            {request.reference}
                          </span>
                        </div>
                      )}
                      {request.adminMessage && (
                        <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                            Resposta
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {request.adminMessage}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Dica */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dica</p>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Cada saque é registado com uma referência única, disponível no histórico acima.
          </p>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Caso ainda não tenha carteira ativa, crie ou ative uma em{' '}
            <Link
              to="/client/wallets"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Carteiras
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  // ── Vista: formulário de saque ───────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Barra de contexto */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Saque automático
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
            Levantar saldo via M-Pesa B2C
          </p>
        </div>
        <button
          type="button"
          onClick={closeWithdrawal}
          disabled={submitting}
          className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← Voltar aos saques
        </button>
      </div>

      <section
        aria-labelledby="withdrawal-heading"
        className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
            Saque
          </p>
          <h2
            id="withdrawal-heading"
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 text-lg font-bold text-slate-900 dark:text-white"
          >
            Levantar saldo
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={submitting} className="space-y-5">
            {/* Secção: Carteira */}
            <section className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Carteira
              </h3>
              {wallets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 px-4 py-4 text-center text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                  Nenhuma carteira disponível para levantamento.
                </div>
              ) : (
                <div role="radiogroup" aria-label="Selecionar carteira" className="space-y-2">
                  {wallets.map((wallet) => (
                    <WalletOption
                      key={wallet.id}
                      wallet={wallet}
                      isSelected={wallet.id === form.walletId}
                      onSelect={(id) => setForm((prev) => ({ ...prev, walletId: id }))}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Secção: Valor */}
            <section className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Valor
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Montante a levantar <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 dark:text-white ${
                      amountValidationMessage
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/40'
                        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-slate-700'
                    } bg-white dark:bg-slate-900`}
                  />
                  {amountValidationMessage && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                      {amountValidationMessage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Telefone de destino <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="84 000 0000"
                    className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 dark:text-white ${
                      phoneValidationMessage
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/40'
                        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-slate-700'
                    } bg-white dark:bg-slate-900`}
                  />
                  {phoneValidationMessage && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                      {phoneValidationMessage}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Resumo de saldo / taxa / total */}
            <div aria-live="polite" className="space-y-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Saldo disponível
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedWallet
                    ? formatCurrency(currentBalance, selectedWallet.currency || 'MZN')
                    : '—'}
                </p>
              </div>
              {form.amount && (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Recebe no M-Pesa</span>
                    <span>{formatCurrency(requestedAmount, selectedWallet?.currency || 'MZN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Taxa da plataforma ({withdrawalFeePercent}%)</span>
                    <span>{formatCurrency(feeAmount, selectedWallet?.currency || 'MZN')}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Total exigido
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(totalRequired, selectedWallet?.currency || 'MZN')}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Observação */}
            <section className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Observação
              </h3>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Motivo ou referência (opcional)"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </section>

            {/* Nota sobre processamento */}
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">Processamento</p>
              <p className="mt-1">
                O valor e a taxa da plataforma serão reservados e o M-Pesa enviará o valor solicitado
                via B2C. Uma rejeição confirmada devolve a reserva. Em caso de timeout, aguarde
                a confirmação e não repita o saque.
              </p>
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-700">
              <button
                type="button"
                onClick={closeWithdrawal}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  !selectedWallet ||
                  !form.amount ||
                  !form.phone ||
                  Boolean(amountValidationMessage) ||
                  Boolean(phoneValidationMessage)
                }
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'A processar...' : 'Confirmar saque'}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
    </div>
  );
}

export default Withdrawals;