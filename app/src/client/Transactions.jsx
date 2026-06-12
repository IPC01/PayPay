import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getWalletTypeLogo } from '../helpers/walletTypeLogos';

function Transactions() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/transactions');
      setTransactions(data);
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao carregar transações',
        message: 'Não foi possível carregar o histórico de transações.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      success: {
        label: 'Sucesso',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      },
      pending: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      failed: {
        label: 'Falhou',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      },
      processing: {
        label: 'Processando',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getTransactionType = (type) => {
    const types = {
      deposit: { label: 'Depósito', icon: '📥', className: 'text-green-600 dark:text-green-400' },
      withdrawal: { label: 'Levantamento', icon: '📤', className: 'text-red-600 dark:text-red-400' },
      transfer: { label: 'Transferência', icon: '🔄', className: 'text-blue-600 dark:text-blue-400' },
      payment: { label: 'Pagamento', icon: '💳', className: 'text-purple-600 dark:text-purple-400' }
    };
    const config = types[type] || { label: type, icon: '💰', className: 'text-slate-600' };
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <span className={`text-sm font-medium ${config.className}`}>{config.label}</span>
      </div>
    );
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.status === filter;
    const matchesSearch = searchTerm === '' || 
      tx.id.toString().includes(searchTerm) ||
      tx.walletCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: transactions.length,
    success: transactions.filter(tx => tx.status === 'success').length,
    pending: transactions.filter(tx => tx.status === 'pending').length,
    failed: transactions.filter(tx => tx.status === 'failed').length,
    totalAmount: transactions
      .filter(tx => tx.status === 'success')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)
  };

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('pt-PT', { 
      style: 'currency', 
      currency: 'MZN',
      minimumFractionDigits: 2
    });
  };

  const renderTypeLogo = (imageUrl, provider) => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={provider || 'Tipo de carteira'}
          className="h-8 w-8 rounded-xl object-contain"
        />
      );
    }

    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {provider?.slice(0, 2) || 'CT'}
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transações</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gerencie e acompanhe todas as transações do sistema
          </p>
        </div>
        <button
          onClick={loadTransactions}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 dark:shadow-brand-950"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sucesso</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.success}</p>
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
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendentes</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Valor Total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === 'success'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Sucesso
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === 'failed'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Falhas
          </button>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por ID, carteira ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-4 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:w-80"
          />
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  ID
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Carteira
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Montante
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Detalhes</span>
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
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A carregar transações...</p>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Nenhuma transação encontrada
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        Limpar busca
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => {
                      setSelectedTransaction(tx);
                      setModalOpen(true);
                    }}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        #{tx.id}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getTransactionType(tx.type)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        {renderTypeLogo(getWalletTypeLogo({ imageUrl: tx.walletTypeImageUrl || tx.wallet?.WalletType?.imageUrl, code: tx.walletTypeCode || tx.wallet?.WalletType?.code }), tx.walletTypeName || tx.wallet?.WalletType?.name)}
                        <span>{tx.walletCode || tx.wallet?.code || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(tx.amount)}
                      </div>
                      {tx.fee > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Taxa: {formatCurrency(tx.fee)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes da Transação */}
      {modalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl transform rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-800">
            <div className="border-b border-slate-200 p-6 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Detalhes da Transação
                </h3>
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

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    ID da Transação
                  </label>
                  <p className="mt-1 font-mono text-sm text-slate-900 dark:text-white">
                    {selectedTransaction.id}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Tipo
                  </label>
                  <div className="mt-1">
                    {getTransactionType(selectedTransaction.type)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Montante
                  </label>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Carteira
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {selectedTransaction.walletCode || selectedTransaction.wallet?.code || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Taxa
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {selectedTransaction.fee ? formatCurrency(selectedTransaction.fee) : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedTransaction.description && (
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Descrição
                  </label>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {selectedTransaction.description}
                  </p>
                </div>
              )}

              {selectedTransaction.reference && (
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Referência
                  </label>
                  <p className="mt-1 font-mono text-sm text-slate-700 dark:text-slate-300">
                    {selectedTransaction.reference}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Data de Criação
                  </label>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {formatDate(selectedTransaction.createdAt)}
                  </p>
                </div>
                {selectedTransaction.updatedAt && (
                  <div>
                    <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Última Atualização
                    </label>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {formatDate(selectedTransaction.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 p-6 dark:border-slate-700">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;