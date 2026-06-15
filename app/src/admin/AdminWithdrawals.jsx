import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function AdminWithdrawals() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      await authRequest(`/api/admin/withdrawals/${id}/${action}`, { method: 'POST' });
      notify({ type: 'success', title: 'Sucesso', message: `Pedido ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.` });
      loadRequests();
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar o pedido.' });
    }
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {loading ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar pedidos...</div>
          ) : requests.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhum pedido de saque pendente.</div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="px-6 py-5 sm:px-8">
                <div className="grid gap-4 md:grid-cols-2 md:items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{request.user?.name || request.userId}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Número: {request.phoneNumber}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Montante: {request.amount}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Origem: {request.wallet?.name || request.walletId}</p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{request.notes || 'Sem observações'}</p>
                  </div>
                  <div className="flex flex-col gap-3 items-start sm:items-end">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{request.status.toUpperCase()}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(request.createdAt).toLocaleString('pt-PT')}</span>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => updateRequest(request.id, 'approve')}
                        disabled={request.status !== 'pending'}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => updateRequest(request.id, 'reject')}
                        disabled={request.status !== 'pending'}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminWithdrawals;
