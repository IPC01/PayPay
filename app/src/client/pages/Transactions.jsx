import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';
import { reversalConfirmMessage, reversalResultNotification } from '../../helpers/transactionReversal';
import { transactionStatusNotification } from '../../helpers/transactionStatus';
import TransactionDetails from '../../shared/components/TransactionDetails';
import ReversalConfirmation from '../../shared/components/ReversalConfirmation';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

function Transactions({ adminView = false, wallet = null }) {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { confirm } = useConfirmation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [reversingId, setReversingId] = useState(null);
  const [queryingStatusId, setQueryingStatusId] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, [adminView, wallet?.id]);

  const loadTransactions = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setLoadError(null);
      }
      const endpoint = adminView ? '/api/admin/transactions' : wallet ? `/api/transactions?walletId=${encodeURIComponent(wallet.id)}` : '/api/transactions';
      const data = await authRequest(endpoint);
      setTransactions(data);
      setSelectedTransaction((current) => current ? data.find((tx) => tx.id === current.id) || current : null);
    } catch (err) {
      console.error(err);
      if (!silent) {
        setLoadError(err.message || 'Não foi possível carregar o histórico de transações.');
        notify({
          type: 'error',
          title: 'Erro ao carregar transações',
          message: err.message || 'Não foi possível carregar o histórico de transações.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página.
  // Filtro, pesquisa e transação selecionada são preservados.
  useAutoRefresh(() => loadTransactions(true));

  const reverseTransaction = async (tx) => {
    if (!(await confirm({
      title: 'Confirmar estorno',
      message: reversalConfirmMessage(tx),
      details: <ReversalConfirmation transaction={tx} />,
      confirmLabel: 'Confirmar estorno'
    }))) return;
    try {
      setReversingId(tx.id);
      const endpoint = adminView ? `/api/admin/transactions/${tx.id}/reverse` : `/api/transactions/${tx.id}/reverse`;
      const result = await authRequest(endpoint, { method: 'POST' });
      notify(reversalResultNotification(result));
      await loadTransactions();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Estorno não realizado',
        message: err.message || 'Não foi possível estornar a transação.'
      });
      await loadTransactions();
    } finally {
      setReversingId(null);
    }
  };

  const queryTransactionStatus = async (tx) => {
    try {
      setQueryingStatusId(tx.id);
      setQueryError(null);
      setQueryResult(null);
      const endpoint = adminView ? `/api/admin/transactions/${tx.id}/status` : `/api/transactions/${tx.id}/status`;
      const result = await authRequest(endpoint);
      setQueryResult(result);
      setTransactions((current) => current.map((transaction) => (
        transaction.id === tx.id ? { ...transaction, status: result.status } : transaction
      )));
      setSelectedTransaction((current) => (
        current?.id === tx.id ? { ...current, status: result.status } : current
      ));
      notify(transactionStatusNotification(result));
      await loadTransactions();
    } catch (err) {
      setQueryError(err.message || 'Não foi possível consultar o estado. Tente novamente mais tarde.');
      notify({
        type: 'error',
        title: 'Não foi possível consultar o estado',
        message: err.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setQueryingStatusId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      reversed: {
        label: 'Estornada',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )
      },
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
    const typeMap = {
      c2b: { label: 'C2B', icon: '⬅️', className: 'text-green-600 dark:text-green-400' },
      b2c: { label: 'B2C', icon: '➡️', className: 'text-blue-600 dark:text-blue-400' },
      deposit: { label: 'Depósito', className: 'text-green-600 dark:text-green-400' },
      withdrawal: { label: 'Levantamento', className: 'text-red-600 dark:text-red-400' },
      transfer: { label: 'Transferência', className: 'text-blue-600 dark:text-blue-400' },
      reversal: { label: 'Estorno', icon: '↩️', className: 'text-purple-600 dark:text-purple-400' }
    };

    const config = typeMap[type] || { label: type?.toString().toUpperCase() || 'Desconhecido', className: 'text-slate-600' };
    return (
      <div className="flex items-center gap-2">
        {config.icon ? <span className="text-lg">{config.icon}</span> : null}
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
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
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

  if (selectedTransaction) {
    return (
      <TransactionDetails
        transaction={selectedTransaction}
        queryResult={queryResult}
        queryError={queryError}
        querying={queryingStatusId === selectedTransaction.id}
        reversing={reversingId === selectedTransaction.id}
        onQuery={queryTransactionStatus}
        onReverse={reverseTransaction}
        onBack={() => setSelectedTransaction(null)}
      />
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 p-4 text-sm text-rose-700 dark:text-rose-300">
        <p>{loadError}</p>
        <button type="button" onClick={() => loadTransactions()} className="mt-2 underline">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{wallet ? 'Transações da carteira' : adminView ? 'Transações da Plataforma' : 'Transações'}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {wallet ? `Todos os movimentos associados à carteira ${wallet.walletCode || wallet.id}, em qualquer estado.` : adminView ? 'Visualize todas as transações do sistema' : 'Gerencie e acompanhe suas transações pessoais'}
          </p>
        </div>
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
                  Carteira
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tipo
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
                      setQueryResult(null);
                      setQueryError(null);
                    }}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        #{tx.id}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        {renderTypeLogo(getWalletTypeLogo({ imageUrl: tx.walletTypeImageUrl || tx.wallet?.WalletType?.imageUrl, code: tx.walletTypeCode || tx.wallet?.WalletType?.code }), tx.walletTypeName || tx.wallet?.WalletType?.name)}
                        <span>{wallet?.walletCode || tx.walletCode || tx.wallet?.code || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getTransactionType(tx.type)}
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
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedTransaction(tx);
                          setQueryResult(null);
                          setQueryError(null);
                        }}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        Ver detalhes / Ações
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Transactions;