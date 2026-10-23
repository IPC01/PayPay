import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

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

  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ walletId: '', amount: '', phone: '', note: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const walletsData = await authRequest('/api/wallets');

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
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {wallet.WalletType?.name || 'Tipo desconhecido'}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Saques
          </h2>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Coluna: formulário (ordem 2 em mobile, 1 em desktop) */}
        <div className="order-2 space-y-4 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm lg:order-1 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Levantar saldo
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Selecione uma carteira à direita (ou acima em mobile) e preencha os dados.
            </p>
          </div>

          {selectedWallet && (
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Carteira selecionada
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedWallet.walletName || selectedWallet.walletCode}
                </p>
                <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedWallet.balance, selectedWallet.currency || 'MZN')}
                </span>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <fieldset disabled={submitting} className="space-y-4">

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
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'A processar...' : 'Confirmar saque'}
            </button>
            </fieldset>
          </form>
        </div>

        {/* Coluna: carteiras (ordem 1 em mobile, 2 em desktop) */}
        <div className="order-1 space-y-3 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm lg:order-2 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Carteiras disponíveis
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {wallets.length} disponíve{wallets.length === 1 ? 'l' : 'is'}
              </p>
            </div>
            {form.walletId && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                1 selecionada
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              A carregar carteiras...
            </div>
          ) : wallets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
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
        </div>
      </div>
    </div>
  );
}

export default Withdrawals;