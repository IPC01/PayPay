import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getWalletTypeLogo } from '../helpers/walletTypeLogos';

function Wallets() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [wallets, setWallets] = useState([]);
  const [walletTypes, setWalletTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [formData, setFormData] = useState({
    walletName: '',
    walletTypeId: '',
    currency: 'MZN'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [editTypeDropdownOpen, setEditTypeDropdownOpen] = useState(false);

  useEffect(() => {
    async function prepare() {
      await authRequest('/api/audit/events', {
        method: 'POST',
        body: {
          action: 'view_wallets_page',
          entity: 'Wallet',
          entityId: null
        }
      }).catch(() => {});

      await loadData();
    }

    prepare();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsData, typesData] = await Promise.all([
        authRequest('/api/wallets'),
        authRequest('/api/wallet-types')
      ]);
      setWallets(walletsData);
      const activeTypes = typesData.filter(type => type.status);
      setWalletTypes(activeTypes);
      if (activeTypes.length > 0) {
        setFormData(prev => ({ ...prev, walletTypeId: String(activeTypes[0].id) }));
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao carregar dados',
        message: 'Não foi possível carregar as carteiras.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await authRequest('/api/wallets', {
        method: 'POST',
        body: {
          walletName: formData.walletName,
          walletTypeId: formData.walletTypeId,
          currency: formData.currency
        }
      });
      
      notify({
        type: 'success',
        title: 'Carteira criada',
        message: `Carteira ${data.wallet.walletCode} criada com sucesso!`
      });
      
      setModalOpen(false);
      setFormData({ walletName: '', walletTypeId: walletTypes[0]?.id || '', currency: 'MZN' });
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await authRequest(`/api/wallets/${selectedWallet.id}`, {
        method: 'PUT',
        body: {
          walletName: formData.walletName,
          currency: formData.currency,
          walletTypeId: formData.walletTypeId
        }
      });
      
      notify({
        type: 'success',
        title: 'Carteira atualizada',
        message: 'Carteira atualizada com sucesso!'
      });
      
      setEditModalOpen(false);
      setSelectedWallet(null);
      loadData();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao atualizar carteira',
        message: err.message || 'Não foi possível atualizar a carteira.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (wallet) => {
    try {
      const nextStatus = wallet.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
      await authRequest(`/api/wallets/${wallet.id}`, {
        method: 'PUT',
        body: { status: nextStatus }
      });
      
      notify({
        type: 'success',
        title: wallet.status === 'ACTIVE' ? 'Carteira desativada' : 'Carteira ativada',
        message: `Carteira ${wallet.walletCode} foi ${wallet.status === 'ACTIVE' ? 'desativada' : 'ativada'} com sucesso.`
      });
      
      loadData();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao alterar status',
        message: err.message || 'Não foi possível alterar o status da carteira.'
      });
    }
  };

  const handleDelete = async (wallet) => {
    if (window.confirm(`Tem certeza que deseja remover visualmente a carteira ${wallet.walletCode}? Esta ação não apagará o registro, apenas fechará a carteira.`)) {
      try {
        await authRequest(`/api/wallets/${wallet.id}`, {
          method: 'DELETE'
        });
        
        notify({
          type: 'success',
          title: 'Carteira removida',
          message: `Carteira ${wallet.walletCode} foi fechada e escondida da lista.`
        });
        
        loadData();
      } catch (err) {
        notify({
          type: 'error',
          title: 'Erro ao fechar carteira',
          message: err.message || 'Não foi possível fechar a carteira.'
        });
      }
    }
  };

  const openEditModal = (wallet) => {
    setSelectedWallet(wallet);
    setFormData({
      walletName: wallet.walletName,
      walletTypeId: String(wallet.walletTypeId),
      currency: wallet.currency
    });
    setEditModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativa</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">Inativa</span>;
  };

  const getCurrencySymbol = (curr) => {
    const symbols = { MZN: 'MT', USD: '$', EUR: '€' };
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

  const selectedWalletType = walletTypes.find((type) => String(type.id) === formData.walletTypeId);
  const selectedWalletTypeLogo = getWalletTypeLogo({
    imageUrl: selectedWalletType?.imageUrl,
    code: selectedWalletType?.code
  });

  const renderTypeLogo = (imageUrl, provider) => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={provider || 'Tipo de carteira'}
          className="h-9 w-9 rounded-2xl object-contain"
        />
      );
    }
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {provider?.slice(0, 2) || 'CT'}
      </div>
    );
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);
  const activeWallets = wallets.filter(w => w.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Carteiras</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gerencie todas as suas carteiras e saldos
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 dark:shadow-brand-950"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Carteira
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Carteiras</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{wallets.length}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carteiras Ativas</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{activeWallets}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo Total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tipos</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{walletTypes.length}</p>
            </div>
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Carteiras */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Código
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Nome
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Saldo
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Moeda
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">A carregar carteiras...</p>
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Nenhuma carteira encontrada
                    </p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Criar primeira carteira
                    </button>
                  </td>
                </tr>
              ) : (
                wallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                        {wallet.walletCode}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {wallet.walletName}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {renderTypeLogo(getWalletTypeLogo({ imageUrl: wallet.WalletType?.imageUrl, code: wallet.WalletType?.code }), wallet.WalletType?.provider)}
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {wallet.WalletType?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(wallet.balance || 0)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {getCurrencySymbol(wallet.currency)} {wallet.currency}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(wallet.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(wallet)}
                          className={`rounded-lg p-2 transition ${
                            wallet.status === 'active'
                              ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-950'
                              : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950'
                          }`}
                          title={wallet.status === 'active' ? 'Desativar' : 'Ativar'}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {wallet.status === 'active' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 5.636a9 9 0 0112.728 12.728M5.636 5.636a9 9 0 0112.728 12.728" />
                            )}
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => openEditModal(wallet)}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          title="Editar"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(wallet)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                          title="Excluir"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criar Carteira */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-800">
            <div className="border-b border-slate-200 p-6 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Criar Nova Carteira
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Preencha os dados para criar uma nova carteira
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate}>
              <div className="space-y-5 p-6">
                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tipo de Carteira *
                  </label>
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    {renderTypeLogo(selectedWalletTypeLogo, selectedWalletType?.provider)}
                  </div>
                  <select
                    value={formData.walletTypeId}
                    onChange={(e) => setFormData({ ...formData, walletTypeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pl-20 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    required
                  >
                    {walletTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome da Carteira *
                  </label>
                  <input
                    type="text"
                    value={formData.walletName}
                    onChange={(e) => setFormData({ ...formData, walletName: e.target.value })}
                    placeholder="Ex: Minha Carteira Principal"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Moeda *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="MZN">Metical (MZN)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 p-6 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.walletName || !formData.walletTypeId}
                  className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Carteira'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Carteira */}
      {editModalOpen && selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-800">
            <div className="border-b border-slate-200 p-6 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Editar Carteira
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Atualize as informações da carteira
                  </p>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Código da Carteira
                  </label>
                  <input
                    type="text"
                    value={selectedWallet.walletCode}
                    disabled
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400"
                  />
                </div>

                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tipo de Carteira *
                  </label>
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    {renderTypeLogo(selectedWalletTypeLogo, selectedWalletType?.provider)}
                  </div>
                  <select
                    value={formData.walletTypeId}
                    onChange={(e) => setFormData({ ...formData, walletTypeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pl-20 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    required
                  >
                    {walletTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome da Carteira *
                  </label>
                  <input
                    type="text"
                    value={formData.walletName}
                    onChange={(e) => setFormData({ ...formData, walletName: e.target.value })}
                    placeholder="Ex: Minha Carteira Principal"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Moeda *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="MZN">Metical (MZN)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 p-6 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.walletName || !formData.walletTypeId}
                  className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
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