import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { API_BASE } from '../../services/api';

function AdminKyc() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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

  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url}`;
  };

  const openKycDetails = async (kycId) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      const response = await authRequest(`/api/kyc/admin/${kycId}`);
      setSelectedKyc(response.kyc);
      setRejectionReason(response.kyc?.rejectionReason || '');
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível carregar os detalhes do KYC.' });
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeKycDetails = () => {
    setDetailModalOpen(false);
    setSelectedKyc(null);
    setRejectionReason('');
  };

  const handleReview = async (status) => {
    if (!selectedKyc) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      notify({ type: 'error', title: 'Erro', message: 'Informe um motivo de rejeição.' });
      return;
    }

    try {
      setSaving(true);
      await authRequest(`/api/kyc/admin/${selectedKyc.id}/review`, {
        method: 'POST',
        body: { status, rejectionReason: rejectionReason.trim() }
      });

      notify({ type: 'success', title: 'Atualizado', message: `KYC ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso.` });
      closeKycDetails();
      loadKycs();
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível revisar o KYC.' });
    } finally {
      setSaving(false);
    }
  };

  const KycDetailsModal = ({
    open,
    loading,
    kyc,
    onClose,
    resolveUrl,
    statusClasses,
    rejectionReason,
    setRejectionReason,
    handleReview,
    saving
  }) => {
    if (!open) return null;

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Detalhes KYC</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{kyc?.User?.name || 'Solicitação KYC'}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{kyc?.User?.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span className="sr-only">Fechar</span>×
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500 dark:text-slate-400">A carregar detalhes do KYC...</div>
        ) : kyc ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(kyc.status)}`}>
                  {kyc.status}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tipo</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{kyc.type || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Submissão</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString('pt-PT') : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Documento</p>
                <p className="mt-2 text-sm text-slate-900 dark:text-white">{kyc.documentType || 'N/A'} - {kyc.documentNumber || 'N/A'}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Nuit: {kyc.nuit || 'N/A'}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Telefone: {kyc.phonePrimary || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Endereço</p>
                <p className="mt-2 text-sm text-slate-900 dark:text-white">{kyc.address || 'N/A'}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{kyc.city || ''} {kyc.province || ''}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{kyc.country || ''}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Documentos enviados</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(kyc.KycDocuments || []).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum documento enviado.</p>
                ) : (
                  (kyc.KycDocuments || []).map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{doc.type}</p>
                      <div className="mt-2 flex gap-2">
                        <a
                          href={resolveUrl(doc.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-700"
                        >
                          Ver
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {kyc.status === 'PENDING' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Motivo de rejeição (obrigatório para rejeitar)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReview('APPROVED')}
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? 'A processar...' : 'Aprovar KYC'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview('REJECTED')}
                    disabled={saving}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                  >
                    {saving ? 'A processar...' : 'Rejeitar KYC'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
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

      {detailModalOpen ? (
        <KycDetailsModal
          open={detailModalOpen}
          loading={detailLoading}
          kyc={selectedKyc}
          onClose={closeKycDetails}
          resolveUrl={resolveUrl}
          statusClasses={statusClasses}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          handleReview={handleReview}
          saving={saving}
        />
      ) : (
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
                      onClick={() => openKycDetails(kyc.id)}
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
      )}
    </div>
  );
}

export default AdminKyc;
