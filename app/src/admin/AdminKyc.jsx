import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function AdminKyc() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [kycs, setKycs] = useState([]);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSelect = (kyc) => {
    setSelectedKyc(kyc);
    setRejectionReason(kyc.rejectionReason || '');
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
      setSelectedKyc(null);
      await loadKycs();
    } catch (err) {
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível atualizar o KYC.' });
    } finally {
      setSaving(false);
    }
  };

  const displayedDocuments = useMemo(() => {
    if (!selectedKyc) return [];
    return selectedKyc.KycDocuments || selectedKyc.KycDocument || [];
  }, [selectedKyc]);

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Solicitações KYC</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Gerencie e revise pedidos de verificação enviados pelos clientes.</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Pedidos de KYC</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Liste e selecione um pedido para ver mais detalhes.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">{kycs.length}</span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar solicitações KYC...</div>
            ) : kycs.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhuma solicitação KYC encontrada.</div>
            ) : (
              kycs.map((kyc) => (
                <button
                  key={kyc.id}
                  type="button"
                  onClick={() => handleSelect(kyc)}
                  className={`flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition ${selectedKyc?.id === kyc.id ? 'bg-brand-50 dark:bg-brand-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{kyc.User?.name || kyc.User?.email || 'Cliente desconhecido'}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kyc.User?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{kyc.type}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kyc.status}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {selectedKyc ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Detalhes</p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Pedido selecionado</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedKyc(null)}
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >Fechar</button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Usuário</p>
                  <p className="mt-2 text-sm text-slate-900 dark:text-white">{selectedKyc.User?.name}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedKyc.User?.email}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Status</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{selectedKyc.status}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Submetido</p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-white">{selectedKyc.submittedAt ? new Date(selectedKyc.submittedAt).toLocaleString('pt-PT') : 'N/A'}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Revisão</p>
                  <p className="mt-2 text-sm text-slate-900 dark:text-white">{selectedKyc.reviewer || 'Ainda não revisado'}</p>
                  {selectedKyc.rejectionReason && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-300">Motivo: {selectedKyc.rejectionReason}</p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Documentos</p>
                  {displayedDocuments.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Nenhum documento foi enviado.</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {displayedDocuments.map((doc) => (
                        <div key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{doc.type}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{doc.originalName}</p>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">Visualizar documento</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedKyc.status !== 'APPROVED' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Motivo de rejeição (apenas se aplicável)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="Informe o motivo caso esteja rejeitando o pedido"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleReview('APPROVED')}
                    className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Aprovar KYC
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleReview('REJECTED')}
                    className="rounded-3xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Rejeitar KYC
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Selecione um pedido KYC para revisar os detalhes e aprovar ou rejeitar.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AdminKyc;
