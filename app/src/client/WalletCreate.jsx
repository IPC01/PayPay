import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function WalletCreate() {
  const { authRequest } = useAuth();
  const [walletTypes, setWalletTypes] = useState([]);
  const [walletTypeId, setWalletTypeId] = useState('');
  const [walletName, setWalletName] = useState('');
  const [currency, setCurrency] = useState('MZN');
  const [message, setMessage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadTypes() {
      try {
        const data = await authRequest('/api/wallet-types');
        setWalletTypes(data.filter(type => type.status));
        if (data.length > 0) {
          setWalletTypeId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadTypes();
  }, [authRequest]);

  const handleSubmit = async event => {
    event.preventDefault();
    setMessage(null);
    setIsCreating(true);

    try {
      const data = await authRequest('/api/wallets', {
        method: 'POST',
        body: { walletName, walletTypeId, currency }
      });
      setMessage({ type: 'success', text: `Carteira criada: ${data.wallet.walletCode}` });
      setWalletName('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-semibold text-slate-900">Criar nova carteira</h2>
        <p className="mt-2 text-slate-500">Escolha um tipo de wallet e personalize o nome.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Tipo de carteira</h3>
          <div className="mt-5 space-y-4">
            {walletTypes.map(type => (
              <label key={type.id} className="flex cursor-pointer items-start gap-4 rounded-3xl border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50">
                <input
                  type="radio"
                  name="walletType"
                  value={type.id}
                  checked={walletTypeId === String(type.id)}
                  onChange={() => setWalletTypeId(String(type.id))}
                  className="mt-1 h-5 w-5 text-brand-600"
                />
                <div>
                  <p className="font-semibold text-slate-900">{type.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{type.provider}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Dados da carteira</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome da carteira</label>
              <input
                type="text"
                value={walletName}
                onChange={e => setWalletName(e.target.value)}
                placeholder="Ex: Vitrine M-Pesa"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Moeda</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
              >
                <option value="MZN">MZN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            {message && (
              <div className={`rounded-3xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            <button
              type="submit"
              disabled={!walletName || !walletTypeId || isCreating}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isCreating ? 'Criando...' : 'Criar carteira'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default WalletCreate;
