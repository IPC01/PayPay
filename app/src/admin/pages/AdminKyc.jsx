import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function AdminKyc() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadKycs();
  }, []);

  const loadKycs = async () => {
    try {
      setLoading(true);
      const response = await authRequest('/api/kyc/admin');
      setKycs(response.kycs || []);
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível carregar as solicitações KYC.' });
    } finally {
      setLoading(false);
    }
  };

  const statusClasses = (status) => {
    if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200';
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200';
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Solicitações KYC</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Revise os pedidos de verificação dos clientes e veja todos os detalhes em uma página dedicada.</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Pedidos de KYC</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Clique em um pedido para abrir a página de detalhes.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">{kycs.length}</span>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar solicitações KYC...</div>
        ) : kycs.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhuma solicitação KYC encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-4">Usuário</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Tipo</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Data</th>
                  <th className="px-4 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                {kycs.map((kyc) => (
                  <tr
                    key={kyc.id}
                    onClick={() => navigate(`/admin/kyc/${kyc.id}`)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{kyc.User?.name || 'Cliente desconhecido'}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{kyc.User?.email}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{kyc.type}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(kyc.status)}`}>
                        {kyc.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString('pt-PT') : 'N/A'}</td>
                    <td className="px-4 py-4 text-right text-brand-600">Ver detalhes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminKyc;
