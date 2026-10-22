import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { assetUrl } from '../../services/api';

const STATUS_LABELS = {
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PENDING: 'Pendente'
};

const STATUS_STYLES = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
};

function AdminKyc() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { confirm } = useConfirmation();
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRaw, setShowRaw] = useState(false);

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
      notify({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Não foi possível carregar as solicitações KYC.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveUrl = (url) => assetUrl(url) || '';

  const openKycDetails = async (kycId) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      setSelectedKyc(null);
      setShowRaw(false);
      const response = await authRequest(`/api/kyc/admin/${kycId}`);
      setSelectedKyc(response.kyc);
      setRejectionReason(response.kyc?.rejectionReason || '');
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Não foi possível carregar os detalhes do KYC.'
      });
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeKycDetails = () => {
    setDetailOpen(false);
    setSelectedKyc(null);
    setRejectionReason('');
    setShowRaw(false);
  };

  const handleReview = async (status) => {
    if (!selectedKyc) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      notify({ type: 'error', title: 'Erro', message: 'Informe um motivo de rejeição.' });
      return;
    }
    if (!(await confirm({
      title: status === 'APPROVED' ? 'Aprovar KYC' : 'Rejeitar KYC',
      message: status === 'APPROVED'
        ? 'Confirma a aprovação deste KYC?'
        : `Confirma a rejeição deste KYC?\n\nMotivo: ${rejectionReason.trim()}`,
      confirmLabel: status === 'APPROVED' ? 'Aprovar KYC' : 'Rejeitar KYC',
      danger: status !== 'APPROVED'
    }))) return;

    try {
      setSaving(true);
      await authRequest(`/api/kyc/admin/${selectedKyc.id}/review`, {
        method: 'POST',
        body: { status, rejectionReason: rejectionReason.trim() }
      });
      notify({
        type: 'success',
        title: 'Atualizado',
        message: `KYC ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso.`
      });
      closeKycDetails();
      loadKycs();
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Não foi possível revisar o KYC.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRowKeyDown = (event, kycId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openKycDetails(kycId);
    }
  };

  const formatLabel = (key) =>
    key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/^./, (char) => char.toUpperCase());

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

    const lowerKey = String(key).toLowerCase();
    if (lowerKey.includes('date') || lowerKey.includes('at') || lowerKey.includes('dob')) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString('pt-PT');
      }
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // ── Painel de detalhes (interno) ──────────────────────────────────────────
  const KycDetails = () => {
    if (!detailOpen) return null;

    const InfoTile = ({ label, children, span = false }) => (
      <div
        className={`rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900 ${span ? 'col-span-2' : ''}`}
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{children}</div>
      </div>
    );

    return (
      <div className="space-y-4">
        {/* Barra de contexto */}
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Solicitação KYC</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {selectedKyc?.User?.name || 'Solicitação'} · {selectedKyc?.User?.email || ''}
            </p>
          </div>
          <button
            type="button"
            onClick={closeKycDetails}
            className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Voltar à lista
          </button>
        </div>

        <div className="max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
                  Detalhes KYC
                </p>
                <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
                  {selectedKyc?.User?.name || 'Solicitação KYC'}
                </h2>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {selectedKyc?.User?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeKycDetails}
                className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Fechar detalhes"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                A carregar detalhes do KYC...
              </div>
            ) : selectedKyc ? (
              <div className="space-y-3 px-4 py-3">
                {/* Resumo: status + tipo + data */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <InfoTile label="Status">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        STATUS_STYLES[selectedKyc.status] ||
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {STATUS_LABELS[selectedKyc.status] || selectedKyc.status}
                    </span>
                  </InfoTile>
                  <InfoTile label="Tipo">{selectedKyc.type || 'N/A'}</InfoTile>
                  <InfoTile label="Submissão">
                    {selectedKyc.submittedAt
                      ? new Date(selectedKyc.submittedAt).toLocaleDateString('pt-PT')
                      : 'N/A'}
                  </InfoTile>
                </div>

                {/* Documento + Endereço */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Documento</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {selectedKyc.documentType || 'N/A'} · {selectedKyc.documentNumber || 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      NUIT: {selectedKyc.nuit || 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Telefone: {selectedKyc.phonePrimary || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Endereço</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {selectedKyc.address || 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {[selectedKyc.city, selectedKyc.province].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {selectedKyc.country || '—'}
                    </p>
                  </div>
                </div>

                {/* Documentos */}
                <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Documentos enviados
                  </p>
                  {(selectedKyc.KycDocuments || []).length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Nenhum documento enviado.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(selectedKyc.KycDocuments || []).map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-800"
                        >
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                            {doc.type}
                          </p>
                          <a
                            href={resolveUrl(doc.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-brand-700"
                          >
                            Ver
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações */}
                {selectedKyc.status === 'PENDING' && (
                  <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                    <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Motivo de rejeição (obrigatório para rejeitar)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleReview('REJECTED')}
                        disabled={saving}
                        className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? 'A processar...' : 'Rejeitar KYC'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview('APPROVED')}
                        disabled={saving}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? 'A processar...' : 'Aprovar KYC'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dados completos (colapsável) */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowRaw((v) => !v)}
                    className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span>Dados completos</span>
                    <span>{showRaw ? '−' : '+'}</span>
                  </button>
                  {showRaw && (
                    <div className="space-y-3 border-t border-slate-200 px-3 py-2 dark:border-slate-700">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Cliente</p>
                        <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {Object.entries(selectedKyc.User || {}).map(([key, value]) => (
                            <div
                              key={`user-${key}`}
                              className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-900"
                            >
                              <p className="text-[10px] uppercase text-slate-500">{formatLabel(key)}</p>
                              <p className="break-words text-xs text-slate-900 dark:text-white">
                                {formatValue(key, value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">KYC</p>
                        <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {Object.entries(selectedKyc)
                            .filter(([key]) => key !== 'User' && key !== 'KycDocuments')
                            .map(([key, value]) => (
                              <div
                                key={`kyc-${key}`}
                                className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-900"
                              >
                                <p className="text-[10px] uppercase text-slate-500">{formatLabel(key)}</p>
                                <p className="break-words text-xs text-slate-900 dark:text-white">
                                  {formatValue(key, value)}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
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
            Solicitações KYC
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Revise os pedidos de verificação dos clientes. Clique numa linha para ver os detalhes.
          </p>
        </div>
      </div>

      {detailOpen ? (
        <KycDetails />
      ) : (
        <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Pedidos de KYC</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Clique em um pedido para abrir os detalhes.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {kycs.length}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              A carregar solicitações KYC...
            </div>
          ) : kycs.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              Nenhuma solicitação KYC encontrada.
            </div>
          ) : (
            <>
              {/* Tabela (md+) */}
              <div className="hidden md:block overflow-x-auto">
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
                        role="button"
                        tabIndex={0}
                        onClick={() => openKycDetails(kyc.id)}
                        onKeyDown={(event) => handleRowKeyDown(event, kyc.id)}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                      >
                        <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                          {kyc.User?.name || 'Cliente desconhecido'}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {kyc.User?.email || '—'}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {kyc.type || '—'}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_STYLES[kyc.status] ||
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {STATUS_LABELS[kyc.status] || kyc.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                          {kyc.submittedAt
                            ? new Date(kyc.submittedAt).toLocaleDateString('pt-PT')
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openKycDetails(kyc.id);
                            }}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                          >
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {kycs.map((kyc) => (
                  <div
                    key={kyc.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openKycDetails(kyc.id)}
                    onKeyDown={(event) => handleRowKeyDown(event, kyc.id)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {kyc.User?.name || 'Cliente desconhecido'}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {kyc.User?.email || '—'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          STATUS_STYLES[kyc.status] ||
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {STATUS_LABELS[kyc.status] || kyc.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Tipo</span>
                        <span className="text-slate-700 dark:text-slate-300">{kyc.type || '—'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Data</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {kyc.submittedAt
                            ? new Date(kyc.submittedAt).toLocaleDateString('pt-PT')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openKycDetails(kyc.id);
                        }}
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
        </section>
      )}
    </div>
  );
}

export default AdminKyc;