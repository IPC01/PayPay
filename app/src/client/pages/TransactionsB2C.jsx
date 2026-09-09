import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';

const renderTypeLogo = (logo, provider) => {
  if (!logo) return null;
  if (typeof logo === 'string') {
    return <img src={logo} alt={provider || 'Logo'} className="h-8 w-8 rounded-full" />;
  }
  return logo;
};

function TransactionsB2C() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [wallets, setWallets] = useState([]);
  const [selectedWalletCode, setSelectedWalletCode] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/wallets');
      const filtered = data.filter((wallet) => wallet.allowB2C && wallet.status === 'ACTIVE');
      setWallets(filtered);
      setSelectedWalletCode(filtered[0]?.walletCode || '');
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao carregar carteiras',
        message: 'Não foi possível carregar as suas carteiras para B2C.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWalletCode) {
      notify({
        type: 'error',
        title: 'Selecione uma carteira',
        message: 'Escolha uma carteira para efetuar B2C.'
      });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      notify({
        type: 'error',
        title: 'Valor inválido',
        message: 'Insira um valor válido para a transferência.'
      });
      return;
    }
    if (!phone.trim()) {
      notify({
        type: 'error',
        title: 'Número inválido',
        message: 'Insira o número que vai receber o pagamento.'
      });
      return;
    }
    if (!reference.trim()) {
      notify({
        type: 'error',
        title: 'Referência obrigatória',
        message: 'Insira uma referência para a transferência.'
      });
      return;
    }

    try {
      setSubmitting(true);
      await authRequest('/api/payments/b2c', {
        method: 'POST',
        body: {
          walletCode: selectedWalletCode,
          amount: Number(amount),
          phone: phone.trim(),
          reference: reference.trim()
        }
      });

      notify({
        type: 'success',
        title: 'B2C realizado',
        message: 'Transferência B2C simulada com sucesso e saldo atualizado.'
      });
      setAmount('');
      setPhone('');
      setReference('');
      await loadWallets();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro no B2C',
        message: err.message || 'Não foi possível realizar a transferência B2C.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transferência B2C</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Selecione uma carteira e preencha os dados para enviar fundos a um número externo.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Formulário B2C</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Carteira</label>
              <select
                value={selectedWalletCode}
                onChange={(event) => setSelectedWalletCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.walletCode}>
                    {wallet.walletName || wallet.walletCode} ({wallet.WalletType?.name || wallet.walletTypeName || 'N/A'}) - {parseFloat(wallet.balance || 0).toFixed(2)} {wallet.currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Insira o valor"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Número que vai receber</label>
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Insira o número do destinatário"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Referência</label>
              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Insira uma referência"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Processando...' : 'Realizar B2C'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Carteiras B2C disponíveis</h3>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">A carregar carteiras...</p>
          ) : wallets.length === 0 ? (
            <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">Nenhuma carteira B2C ativa disponível.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {renderTypeLogo(getWalletTypeLogo({ imageUrl: wallet.WalletType?.imageUrl, code: wallet.WalletType?.code }), wallet.WalletType?.provider)}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{wallet.walletName || wallet.walletCode}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{wallet.WalletType?.name || 'Tipo desconhecido'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{parseFloat(wallet.balance || 0).toFixed(2)} {wallet.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionsB2C;
