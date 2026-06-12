import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function WalletCreate() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [walletTypes, setWalletTypes] = useState([]);
  const [walletTypeId, setWalletTypeId] = useState('');
  const [walletName, setWalletName] = useState('');
  const [currency, setCurrency] = useState('MZN');
  const [isCreating, setIsCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [createdWallet, setCreatedWallet] = useState(null);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await authRequest('/api/wallet-types');
      const activeTypes = data.filter(type => type.status);
      setWalletTypes(activeTypes);
      if (activeTypes.length > 0) {
        setWalletTypeId(String(activeTypes[0].id));
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Falha ao carregar tipos de carteira',
        message: 'Não foi possível carregar os tipos de carteira disponíveis.'
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsCreating(true);

    try {
      const data = await authRequest('/api/wallets', {
        method: 'POST',
        body: { walletName, walletTypeId, currency }
      });
      
      setCreatedWallet(data.wallet);
      setModalOpen(true);
      setWalletName('');
      
      notify({
        type: 'success',
        title: 'Carteira criada',
        message: `Carteira criada: ${data.wallet.walletCode}`
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Falha ao criar carteira',
        message: err.message || 'Não foi possível criar a carteira.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getCurrencySymbol = (curr) => {
    const symbols = {
      MZN: 'MT',
      USD: '$',
      EUR: '€'
    };
    return symbols[curr] || curr;
  };

  const getProviderIcon = (provider) => {
    const icons = {
      'MPesa': '📱',
      'E-Mola': '💳',
      'Bank': '🏦',
      'Cash': '💰'
    };
    return icons[provider] || '💼';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Criar Nova Carteira</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Escolha o tipo de carteira e personalize as informações
          </p>
        </div>
        <button
          onClick={loadTypes}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar Tipos
        </button>
      </div>

      {/* Cards de Informação */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm dark:border-slate-700 dark:from-blue-950/20 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tipos Disponíveis</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{walletTypes.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm dark:border-slate-700 dark:from-green-950/20 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Moeda Padrão</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{currency}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm dark:border-slate-700 dark:from-purple-950/20 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Segurança</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Criptografada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Seleção de Tipo de Carteira */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tipo de carteira</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Selecione o tipo de carteira desejado
                </p>
              </div>
              <div className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                Obrigatório
              </div>
            </div>
            
            {walletTypes.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Nenhum tipo de carteira disponível
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletTypes.map((type, index) => (
                  <label
                    key={type.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                      walletTypeId === String(type.id)
                        ? 'border-brand-500 bg-brand-50 shadow-md dark:border-brand-400 dark:bg-brand-950/20'
                        : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="walletType"
                      value={type.id}
                      checked={walletTypeId === String(type.id)}
                      onChange={() => setWalletTypeId(String(type.id))}
                      className="mt-1 h-5 w-5 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                      {type.imageUrl ? (
                        <img
                          src={type.imageUrl}
                          alt={type.name}
                          className="h-10 w-10 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{getProviderIcon(type.provider)}</span>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{type.name}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{type.provider}</p>
                        {type.description && (
                          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{type.description}</p>
                        )}
                      </div>
                    </div>
                    </div>
                    {walletTypeId === String(type.id) && (
                      <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Dados da Carteira */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Dados da carteira</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Preencha as informações da nova carteira
                </p>
              </div>
              <div className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                Novo
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome da carteira *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="Ex: Minha Carteira Principal, Pagamentos Online"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Escolha um nome descritivo para identificar facilmente sua carteira
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Moeda *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-lg">{getCurrencySymbol(currency)}</span>
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="MZN">Metical (MZN)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  A moeda determina os valores das transações da carteira
                </p>
              </div>

              {/* Resumo da Seleção */}
              {walletTypeId && walletName && (
                <div className="mt-4 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 p-4 dark:from-brand-950/20 dark:to-blue-950/20">
                  <p className="text-xs font-medium uppercase text-brand-600 dark:text-brand-400">
                    Resumo da Carteira
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Nome:</span> {walletName}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Moeda:</span> {currency} ({getCurrencySymbol(currency)})
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Tipo:</span> {walletTypes.find(t => String(t.id) === walletTypeId)?.name || 'Selecionado'}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!walletName || !walletTypeId || isCreating}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:shadow-brand-950"
              >
                {isCreating ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando carteira...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Criar carteira
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal de Sucesso */}
      {modalOpen && createdWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-800">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                Carteira criada com sucesso!
              </h3>
              <div className="mt-4 rounded-xl bg-slate-100 p-4 dark:bg-slate-900">
                <p className="text-sm text-slate-600 dark:text-slate-400">Código da carteira</p>
                <p className="mt-1 font-mono text-lg font-bold text-brand-600 dark:text-brand-400">
                  {createdWallet.walletCode}
                </p>
              </div>
              <div className="mt-4 space-y-2 text-left">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Nome:</span> {createdWallet.walletName}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Moeda:</span> {createdWallet.currency}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Status:</span>{' '}
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Ativa
                  </span>
                </p>
              </div>
            </div>
            <div className="border-t border-slate-200 p-6 dark:border-slate-700">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletCreate;