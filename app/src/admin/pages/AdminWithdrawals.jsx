import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const statusLabels = {
  pending: 'Em confirmação',
  approved: 'Concluído',
  rejected: 'Não realizado'
};

const STATUS_STYLES = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN'
  });
}

function AdminWithdrawals() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/withdrawals');
      setRequests(data);
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro', message: 'Não foi possível carregar pedidos de saque.' });
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (event, request) => {
    if (event) event.stopPropagation();
    setSelectedRequest(request);
  };

  const closeDetails = () => setSelectedRequest(null);

  const handleRowKeyDown = (event, request) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedRequest(request);
    }
  };

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests
      .filter((request) => {
        const userName = request.User?.name || '';
        const phone = request.phone || request.phoneNumber || '';
        const walletName = request.Wallet?.walletName || request.Wallet?.walletCode || '';
        const amount = request.amount != null ? String(request.amount) : '';
        const status = request.status || '';
        return (
          (!query ||
            [userName, request.User?.email || '', phone, walletName, amount, status, request.reference || '']
              .join(' ')
              .toLowerCase()
              .includes(query)) &&
          (!statusFilter || status === statusFilter)
        );
      })
      .sort((a, b) => {
        const x = a[sortBy] ?? '';
        const y = b[sortBy] ?? '';

        if (sortBy === 'amount') {
          return sortOrder === 'asc' ? x - y : y - x;
        }

        const left = String(x).toLowerCase();
        const right = String(y).toLowerCase();

        if (left < right) return sortOrder === 'asc' ? -1 : 1;
        if (left > right) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [requests, search, sortBy, sortOrder, statusFilter]);

  const setSortField = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder('asc');
  };

  // ── Detalhes (componente interno compacto) ────────────────────────────────
  const WithdrawalDetailsCard = ({ request, onClose }) => {
    if (!request) return null;

    const InfoField = ({ label, value, mono = false, breakAll = false }) => (
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
        <p
          className={`mt-0.5 text-sm font-semibold text-slate-900 dark:text-white ${
            mono ? 'font-mono' : ''
          } ${breakAll ? 'break-all' : 'truncate'}`}
        >
          {value}
        </p>
      </div>
    );

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
              Detalhes do Saque
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
              {request.User?.name || request.userId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Fechar detalhes"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="space-y-3 px-4 py-3">
          {/* Montante destacado */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Montante</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(request.amount)}
            </p>
          </div>

          {/* Grid 2x2 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Estado</p>
              <span
                className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  STATUS_STYLES[request.status] ||
                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {statusLabels[request.status] || request.status}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Telefone</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                {request.phone || request.phoneNumber || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Carteira</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                {request.Wallet?.walletName || request.Wallet?.walletCode || request.walletId || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Processado em</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
                {request.processedAt
                  ? new Date(request.processedAt).toLocaleString('pt-PT')
                  : '—'}
              </p>
            </div>
          </div>

          {/* Referência */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Referência</p>
            <p className="mt-0.5 break-all font-mono text-xs text-slate-900 dark:text-white">
              {request.reference || '—'}
            </p>
          </div>

          {/* Mensagem admin */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Mensagem do admin</p>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
              {request.adminMessage || 'Sem observações'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Pedidos de Saque
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Revise e aprove ou rejeite pedidos de saque dos clientes.
          </p>
        </div>
      </div>

      {selectedRequest ? (
        <div className="min-w-0 space-y-4">
          {/* Barra de contexto */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Pedido selecionado</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {selectedRequest.User?.name || selectedRequest.userId} ·{' '}
                {formatCurrency(selectedRequest.amount)}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDetails}
              className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ← Voltar à lista
            </button>
          </div>

          {/* Card de detalhes compacto, largura limitada */}
          <div className="max-w-xl">
            <WithdrawalDetailsCard request={selectedRequest} onClose={closeDetails} />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar por utilizador, email, número, carteira, montante ou estado"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:flex-1"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:w-56"
              >
                <option value="">Filtrar por estado</option>
                <option value="pending">Em confirmação</option>
                <option value="approved">Concluído</option>
                <option value="rejected">Não realizado</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Ordenar por:</span>
              {[
                { key: 'createdAt', label: 'Data' },
                { key: 'amount', label: 'Montante' },
                { key: 'status', label: 'Estado' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortField(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    sortBy === key
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              A carregar pedidos...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              Nenhum pedido de saque encontrado.
            </div>
          ) : (
            <>
              {/* Tabela (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                  <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-4">Utilizador</th>
                      <th className="px-4 py-4">Telefone</th>
                      <th className="px-4 py-4">Origem</th>
                      <th className="px-4 py-4">Montante</th>
                      <th className="px-4 py-4">Estado</th>
                      <th className="px-4 py-4">Data</th>
                      <th className="px-4 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedRequest(request)}
                        onKeyDown={(event) => handleRowKeyDown(event, request)}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                      >
                        <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                          {request.User?.name || request.userId}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {request.phone || request.phoneNumber}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {request.Wallet?.walletName || request.Wallet?.walletCode || request.walletId}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatCurrency(request.amount)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_STYLES[request.status] ||
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {statusLabels[request.status] || request.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(request.createdAt).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={(event) => viewDetails(event, request)}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRequest(request)}
                    onKeyDown={(event) => handleRowKeyDown(event, request)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {request.User?.name || request.userId}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {request.phone || request.phoneNumber || '—'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          STATUS_STYLES[request.status] ||
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {statusLabels[request.status] || request.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Carteira</span>
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {request.Wallet?.walletName || request.Wallet?.walletCode || request.walletId || '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Montante</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(request.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider">Data</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(request.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={(event) => viewDetails(event, request)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminWithdrawals;