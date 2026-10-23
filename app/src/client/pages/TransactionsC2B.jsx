import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

function formatCurrency(value, currency = 'MZN') {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });
}

const renderTypeLogo = (logo, provider, size = 'md') => {
  const sizes = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-10 w-10' };
  const cls = `${sizes[size]} rounded-lg object-contain`;
  if (!logo) {
    return (
      <div
        className={`flex ${sizes[size]} items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300`}
      >
        {provider?.slice(0, 2)?.toUpperCase() || 'CT'}
      </div>
    );
  }
  if (typeof logo === 'string') {
    return <img src={logo} alt={provider || 'Logo'} className={cls} />;
  }
  return logo;
};

function TransactionsC2B() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { settings } = useSettings();
  const [wallets, setWallets] = useState([]);
  const [selectedWalletCode, setSelectedWalletCode] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await authRequest('/api/wallets');
      const filtered = data.filter(
        (wallet) =>
          wallet.allowC2B &&
          wallet.status === 'ACTIVE' &&
          wallet.WalletType?.code?.toLowerCase() === 'mpesa'
      );
      setWallets(filtered);
      setSelectedWalletCode((prev) =>
        filtered.some((w) => w.walletCode === prev)
          ? prev
          : filtered[0]?.walletCode || ''
      );
    } catch (err) {
      console.error(err);
      if (!silent) {
        notify({
          type: 'error',
          title: 'Erro ao carregar carteiras',
          message: 'Não foi possível carregar as suas carteiras para C2B.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página.
  // A carteira selecionada e os campos do pagamento (valor, telefone,
  // referência) são preservados.
  useAutoRefresh(() => loadWallets(true));

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletCode === selectedWalletCode) || null,
    [wallets, selectedWalletCode]
  );

  // Simulação da taxa da plataforma (percentagem retida no depósito C2B)
  const c2bFeePercent = Number(settings?.c2bFeePercent) || 0;
  const depositAmount = Number(amount || 0);
  const c2bFeeAmount =
    depositAmount > 0 ? Number(((depositAmount * c2bFeePercent) / 100).toFixed(2)) : 0;
  const c2bNetAmount = Number((depositAmount - c2bFeeAmount).toFixed(2));

  const handleSelectWallet = (code) => {
    setSelectedWalletCode(code);
  };

  const handleWalletKeyDown = (event, code) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedWalletCode(code);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWalletCode) {
      notify({
        type: 'error',
        title: 'Selecione uma carteira',
        message: 'Escolha uma carteira para efetuar C2B.'
      });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      notify({
        type: 'error',
        title: 'Valor inválido',
        message: 'Insira um valor válido para o pagamento.'
      });
      return;
    }
    if (!phone.trim()) {
      notify({
        type: 'error',
        title: 'Número inválido',
        message: 'Insira o número de transferência.'
      });
      return;
    }
    try {
      setSubmitting(true);
      const result = await authRequest('/api/payments/c2b', {
        method: 'POST',
        body: {
          walletCode: selectedWalletCode,
          amount: Number(amount),
          phone: phone.trim()
        }
      });

      notify({
        type: result.pending ? 'warning' : 'success',
        title: result.pending ? 'Pagamento em confirmação' : 'C2B realizado',
        message: result.pending
          ? `${result.message} Referência: ${result.reference}. Não repita o pagamento.`
          : `Pagamento confirmado pelo M-Pesa e valor integral creditado. Referência: ${result.reference}.`
      });
      setAmount('');
      setPhone('');
      await loadWallets();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro no C2B',
        message: err.message || 'Não foi possível realizar o C2B.'
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
      onClick={() => onSelect(wallet.walletCode)}
      onKeyDown={(event) => handleWalletKeyDown(event, wallet.walletCode)}
      className={`cursor-pointer rounded-xl border p-3 transition focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
        isSelected
          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-900/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900'
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
            Transações C2B
          </h2>
     
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Coluna: formulário (ordem 2 em mobile, 1 em desktop) */}
        <div className="order-2 space-y-4 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm lg:order-1 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Formulário C2B
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Selecione uma carteira à direita (ou abaixo em mobile) e preencha os dados.
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Valor <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Insira o valor"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Número de transferência <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                placeholder="Ex: 84xxxxxxx"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {depositAmount > 0 && (
              <div aria-live="polite" className="space-y-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Taxa da plataforma ({c2bFeePercent}%)</span>
                  <span>{formatCurrency(c2bFeeAmount, selectedWallet?.currency || 'MZN')}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Recebe na carteira
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(c2bNetAmount, selectedWallet?.currency || 'MZN')}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedWalletCode}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Processando...' : 'Realizar C2B'}
            </button>
          </form>
        </div>

        {/* Coluna: carteiras (ordem 1 em mobile, 2 em desktop) */}
        <div className="order-1 space-y-3 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm lg:order-2 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Carteiras C2B
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {wallets.length} disponíve{wallets.length === 1 ? 'l' : 'is'}
              </p>
            </div>
            {selectedWalletCode && (
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
              Nenhuma carteira C2B ativa disponível.
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label="Selecionar carteira C2B"
              className="space-y-2"
            >
              {wallets.map((wallet) => (
                <WalletOption
                  key={wallet.id}
                  wallet={wallet}
                  isSelected={wallet.walletCode === selectedWalletCode}
                  onSelect={handleSelectWallet}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionsC2B;