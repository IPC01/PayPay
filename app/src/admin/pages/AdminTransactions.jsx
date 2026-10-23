import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { reversalConfirmMessage, reversalResultNotification } from '../../helpers/transactionReversal';
import { transactionStatusNotification } from '../../helpers/transactionStatus';
import TransactionDetails from '../../shared/components/TransactionDetails';
import ReversalConfirmation from '../../shared/components/ReversalConfirmation';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { isAdmin } from '../../helpers/roles';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

const STATUS_LABELS = {
  success: 'Sucesso',
  pending: 'Pendente',
  failed: 'Falhou',
  reversed: 'Estornada'
};

const STATUS_STYLES = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  failed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  reversed: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN'
  });
}

function AdminTransactions({ wallet = null }) {
  const Heading = wallet ? 'h2' : 'h1';
  const { authRequest, user } = useAuth();
  const { notify } = useNotification();
  const { confirm } = useConfirmation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reversingId, setReversingId] = useState(null);
  const [queryingStatusId, setQueryingStatusId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [wallet?.id]);

  // Repõe a primeira página ao mudar de carteira ou de qualquer filtro
  useEffect(() => {
    setPage(1);
  }, [wallet?.id, statusFilter, typeFilter, clientFilter, walletFilter, dateFrom, dateTo]);

  const loadTransactions = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setLoadError(null);
      }
      const data = await authRequest(
        wallet ? `/api/admin/wallets/${wallet.id}/transactions` : '/api/admin/transactions'
      );
      setTransactions(data || []);
      setSelectedTransaction((current) =>
        current ? data.find((tx) => tx.id === current.id) || current : null
      );
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

  // Sincronização automática a cada 20 segundos, sem recarregar a página
  // nem alterar a transação selecionada.
  useAutoRefresh(() => loadTransactions(true));

  const reverseTransaction = async (transaction) => {
    if (!(await confirm({
      title: 'Confirmar estorno',
      message: reversalConfirmMessage(transaction),
      details: <ReversalConfirmation transaction={transaction} />,
      confirmLabel: 'Confirmar estorno'
    }))) return;
    try {
      setReversingId(transaction.id);
      const result = await authRequest(`/api/admin/transactions/${transaction.id}/reverse`, {
        method: 'POST'
      });
      notify(reversalResultNotification(result));
    } catch (err) {
      notify({
        type: 'error',
        title: 'Estorno não realizado',
        message: err.message || 'Não foi possível estornar a transação.'
      });
    } finally {
      setReversingId(null);
      await loadTransactions();
    }
  };

  const queryTransactionStatus = async (transaction) => {
    try {
      setQueryingStatusId(transaction.id);
      setQueryError(null);
      setQueryResult(null);
      const result = await authRequest(`/api/admin/transactions/${transaction.id}/status`);
      setQueryResult(result);
      setSelectedTransaction((current) =>
        current?.id === transaction.id ? { ...current, status: result.status } : current
      );
      notify(transactionStatusNotification(result));
    } catch (err) {
      setQueryError(err.message || 'Não foi possível consultar o estado. Tente novamente mais tarde.');
      notify({
        type: 'error',
        title: 'Não foi possível consultar o estado',
        message: err.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setQueryingStatusId(null);
      await loadTransactions();
    }
  };

  const openTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setQueryResult(null);
    setQueryError(null);
  };

  const handleRowKeyDown = (event, transaction) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openTransaction(transaction);
    }
  };

  // Carteiras presentes nas transações carregadas (para o filtro por carteira)
  const walletOptions = useMemo(
    () => [...new Set(transactions.map((tx) => tx.walletCode).filter(Boolean))].sort(),
    [transactions]
  );

  // Filtros: estado, tipo, cliente, carteira e intervalo de datas
  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter && tx.status !== statusFilter) return false;
    if (typeFilter && tx.type !== typeFilter) return false;
    if (walletFilter && tx.walletCode !== walletFilter) return false;
    if (clientFilter.trim()) {
      const query = clientFilter.trim().toLowerCase();
      const name = tx.walletInfo?.user?.name || '';
      const email = tx.walletInfo?.user?.email || '';
      if (!`${name} ${email}`.toLowerCase().includes(query)) return false;
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (new Date(tx.createdAt) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(tx.createdAt) > to) return false;
    }
    return true;
  });

  const hasActiveFilters = Boolean(
    statusFilter || typeFilter || clientFilter.trim() || walletFilter || dateFrom || dateTo
  );

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setClientFilter('');
    setWalletFilter('');
    setDateFrom('');
    setDateTo('');
  };

  // Ordena sempre por data (mais recente primeiro) e pagina 25 elementos por página
  const PAGE_SIZE = 25;
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const pageStart = sortedTransactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, sortedTransactions.length);

  // Vista de detalhe (componente selecionado)
  if (selectedTransaction) {
    return (
      <TransactionDetails
        transaction={selectedTransaction}
        queryResult={queryResult}
        queryError={queryError}
        querying={queryingStatusId === selectedTransaction.id}
        reversing={reversingId === selectedTransaction.id}
        onQuery={queryTransactionStatus}
        onReverse={isAdmin(user) ? reverseTransaction : undefined}
        onBack={() => setSelectedTransaction(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {wallet ? 'Transações da carteira' : 'Transações'}
          </Heading>
    
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrar por estado"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="">Todos os estados</option>
          <option value="success">Sucesso</option>
          <option value="pending">Pendente</option>
          <option value="failed">Falhou</option>
          <option value="reversed">Estornada</option>
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filtrar por tipo de transação"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="">Todos os tipos</option>
          <option value="c2b">C2B (depósito)</option>
          <option value="withdrawal">Levantamento (B2C)</option>
          <option value="reversal">Estorno</option>
          <option value="subscription">Subscrição</option>
          <option value="payment">Pagamento</option>
          <option value="direct">Direto</option>
        </select>

        <input
          type="text"
          value={clientFilter}
          onChange={(event) => setClientFilter(event.target.value)}
          placeholder="Cliente (nome ou email)"
          aria-label="Filtrar por cliente"
          className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:w-56"
        />

        {!wallet && (
          <select
            value={walletFilter}
            onChange={(event) => setWalletFilter(event.target.value)}
            aria-label="Filtrar por carteira"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">Todas as carteiras</option>
            {walletOptions.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          aria-label="Data inicial"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          aria-label="Data final"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => loadTransactions()}
            className="mt-2 font-semibold underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-0 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              A carregar transações...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              Nenhuma transação encontrada.
            </div>
          ) : (
            <>
              {/* Tabela (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Referência</th>
                      <th className="px-6 py-4">Carteira</th>
                      <th className="px-6 py-4">Utilizador</th>
                      <th className="px-6 py-4">Montante</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Data</th>              
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-700 dark:bg-slate-800">
                    {paginatedTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openTransaction(transaction)}
                        onKeyDown={(event) => handleRowKeyDown(event, transaction)}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {transaction.reference || transaction.id}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {wallet?.walletCode || transaction.walletCode || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {transaction.walletInfo?.user?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_STYLES[transaction.status] ||
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {STATUS_LABELS[transaction.status] || transaction.status}
                            {transaction.type === 'reversal' ? ' · estorno' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(transaction.createdAt).toLocaleDateString('pt-PT')}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {paginatedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openTransaction(transaction)}
                    onKeyDown={(event) => handleRowKeyDown(event, transaction)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {transaction.reference || `TX-${transaction.id}`}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {transaction.walletInfo?.user?.name || 'Sem utilizador'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          STATUS_STYLES[transaction.status] ||
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {STATUS_LABELS[transaction.status] || transaction.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Carteira</span>
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {wallet?.walletCode || transaction.walletCode || '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Montante</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider">Data</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(transaction.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      {transaction.type === 'reversal' && (
                        <div className="text-right">
                          <span className="block uppercase tracking-wider">Tipo</span>
                          <span className="text-slate-700 dark:text-slate-300">Estorno</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTransaction(transaction);
                        }}
                        className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
                      >
                        Ver detalhes / Ações
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação: 25 transações por página */}
              <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A mostrar {pageStart}–{pageEnd} de {sortedTransactions.length} transações
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Seguinte
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminTransactions;