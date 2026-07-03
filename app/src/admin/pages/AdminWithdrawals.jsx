import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

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

  const updateRequest = async (id, action) => {
    try {
      await authRequest(`/api/admin/withdrawals/${id}/${action}`, {
        method: 'POST',
        body: { adminMessage: '' }
      });
      notify({ type: 'success', title: 'Sucesso', message: `Pedido ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.` });
      loadRequests();
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível atualizar o pedido.' });
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
  };

  const closeDetails = () => {
    setSelectedRequest(null);
  };

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests
      .filter((request) => {
        const userName = request.user?.name || '';
        const phone = request.phone || request.phoneNumber || '';
        const walletName = request.wallet?.walletName || request.wallet?.walletCode || '';
        const amount = request.amount != null ? String(request.amount) : '';
        const status = request.status || '';
        return (
          (!query ||
            [userName, request.user?.email || '', phone, walletName, amount, status]
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

  const WithdrawalDetailsModal = ({ request, onClose }) => {
    if (!request) return null;

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Detalhes do Pedido de Saque</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Informações de aprovação/rejeição e histórico do pedido.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>

        <div className="mt-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Utilizador</h3>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{request.user?.name || request.userId}</p>
              <p className="text-slate-500 dark:text-slate-400">{request.user?.email || '-'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Status</h3>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{request.status?.toUpperCase()}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Admin</h3>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{request.Admin?.name || request.adminId ? `ID ${request.adminId}` : '-'}</p>
              <p className="text-slate-500 dark:text-slate-400">{request.Admin?.email || '-'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Processado em</h3>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{request.processedAt ? new Date(request.processedAt).toLocaleString('pt-PT') : '-'}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Carteira</h3>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{request.wallet?.walletName || request.wallet?.walletCode || '-'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Montante</h3>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{request.amount}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Mensagem do admin</h3>
            <p className="mt-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
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
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Administração</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Pedidos de Saque</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Revise e aprove ou rejeite pedidos de saque dos clientes.</p>
        </div>
      </div>

      {selectedRequest ? (
        <WithdrawalDetailsModal request={selectedRequest} onClose={closeDetails} />
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar por utilizador, email, número, carteira, montante ou estado"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:w-[330px]"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:w-72"
              >
                <option value="">Filtrar por estado</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Ordenar por:</span>
              <button
                type="button"
                onClick={() => setSortField('createdAt')}
                className={`rounded-full px-3 py-2 transition ${sortBy === 'createdAt' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                Data
              </button>
              <button
                type="button"
                onClick={() => setSortField('amount')}
                className={`rounded-full px-3 py-2 transition ${sortBy === 'amount' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                Montante
              </button>
              <button
                type="button"
                onClick={() => setSortField('status')}
                className={`rounded-full px-3 py-2 transition ${sortBy === 'status' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                Estado
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar pedidos...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhum pedido de saque encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
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
                    <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{request.user?.name || request.userId}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{request.phone || request.phoneNumber}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{request.wallet?.walletName || request.wallet?.walletCode || request.walletId}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{request.amount}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' : request.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200'}`}>
                          {request.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{new Date(request.createdAt).toLocaleDateString('pt-PT')}</td>
                      <td className="px-4 py-4 text-right">
                        {request.status === 'pending' ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => updateRequest(request.id, 'approve')}
                              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => updateRequest(request.id, 'reject')}
                              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                            >
                              Rejeitar
                            </button>
                          </div>
                        ) : request.status === 'rejected' ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => updateRequest(request.id, 'approve')}
                              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => viewDetails(request)}
                              className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                            >
                              Ver
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => viewDetails(request)}
                            className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                          >
                            Ver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminWithdrawals;
