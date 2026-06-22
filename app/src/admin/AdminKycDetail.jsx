import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { API_BASE } from '../services/api';

function statusClasses(status) {
  if (status === 'APPROVED') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200';
  }
  if (status === 'REJECTED') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200';
  }
  if (status === 'PENDING') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200';
}

function resolveUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
}

function AdminKycDetail() {
  const { id } = useParams();
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadKyc();
  }, [id]);

  const loadKyc = async () => {
    try {
      setLoading(true);
      const response = await authRequest(`/api/kyc/admin/${id}`);
      setKyc(response.kyc);
      setRejectionReason(response.kyc?.rejectionReason || '');
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível carregar o KYC.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    if (!kyc) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      notify({ type: 'error', title: 'Erro', message: 'Informe um motivo de rejeição.' });
      return;
    }

    try {
      setSaving(true);
      await authRequest(`/api/kyc/admin/${kyc.id}/review`, {
        method: 'POST',
        body: { status, rejectionReason: rejectionReason.trim() }
      });
      notify({ type: 'success', title: 'Atualizado', message: `KYC ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso.` });
      navigate('/admin/kyc');
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível revisar o KYC.' });
    } finally {
      setSaving(false);
    }
  };

  const downloadDocument = async (doc) => {
    try {
      const url = resolveUrl(doc.url);
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = doc.originalName || `${doc.type}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      notify({ type: 'error', title: 'Erro', message: 'Não foi possível baixar o documento.' });
    }
  };

  const renderField = (label, value) => (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-sm text-slate-900 dark:text-white">{value || 'Não informado'}</p>
    </div>
  );

  const renderSection = (title, fields, gridCols = 'lg:grid-cols-2') => (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        {title}
      </h3>
      <div className={`grid gap-4 ${gridCols}`}>
        {fields}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800 text-slate-500 dark:text-slate-400">A carregar detalhes do KYC...</div>
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800 text-slate-500 dark:text-slate-400">KYC não encontrado.</div>
      </div>
    );
  }

  const documents = kyc.KycDocuments || kyc.KycDocument || [];

  // Organize fields by sections
  const personalFields = [
    renderField('Nome completo', `${kyc.firstName || ''} ${kyc.otherNames || ''} ${kyc.lastName || ''}`.trim()),
    renderField('Gênero', kyc.gender),
    renderField('Data de nascimento', kyc.dateOfBirth),
    renderField('Nacionalidade', kyc.nationality),
    renderField('Nuit', kyc.nuit),
  ];

  const documentFields = [
    renderField('Tipo de documento', kyc.documentType),
    renderField('Número do documento', kyc.documentNumber),
    renderField('Emitido em', kyc.documentIssuedAt),
    renderField('Validade do documento', kyc.documentExpiresAt),
    renderField('Emitido por', kyc.documentIssuer),
  ];

  const contactFields = [
    renderField('Telefone principal', kyc.phonePrimary),
    renderField('Telefone secundário', kyc.phoneSecondary),
    renderField('E-mail de contato', kyc.contactEmail),
  ];

  const addressFields = [
    renderField('Endereço', kyc.address),
    renderField('País', kyc.country),
    renderField('Província', kyc.province),
    renderField('Distrito', kyc.district),
    renderField('Cidade', kyc.city),
    renderField('Bairro', kyc.neighborhood),
    renderField('Rua', kyc.street),
    renderField('Número', kyc.houseNumber),
    renderField('Código postal', kyc.postalCode),
  ];

  const businessFields = [
    renderField('Nome da empresa', kyc.businessName),
    renderField('Nuit da empresa', kyc.companyNuit),
    renderField('Número de registro', kyc.registrationNumber),
    renderField('Data de registro', kyc.registrationDate),
    renderField('Forma legal', kyc.legalForm),
    renderField('Setor econômico', kyc.economicSector),
    renderField('Descrição da atividade', kyc.activityDescription),
    renderField('Website', kyc.website),
    renderField('E-mail comercial', kyc.businessEmail),
    renderField('Telefone comercial', kyc.businessPhone),
  ];

  const financialFields = [
    renderField('Fonte de fundos', kyc.sourceOfFunds),
    renderField('Propósito da conta', kyc.accountPurpose),
    renderField('Volume mensal', kyc.monthlyVolume),
    renderField('Volume anual', kyc.annualVolume),
    renderField('Origem de fundos', kyc.originOfFunds),
    renderField('País principal de operação', kyc.mainOperationCountry),
  ];

  const bankingFields = [
    renderField('Banco', kyc.bankName),
    renderField('IBAN', kyc.iban),
    renderField('Beneficiário', kyc.beneficialOwnerName),
    renderField('Nacionalidade do beneficiário', kyc.beneficialOwnerNationality),
    renderField('Data de nascimento do beneficiário', kyc.beneficialOwnerDob),
    renderField('Documento do beneficiário', kyc.beneficialOwnerDocumentNumber),
    renderField('Participação do beneficiário', kyc.beneficialOwnerShare),
  ];

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Detalhes do KYC</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Revise todas as informações do usuário antes de aprovar ou rejeitar.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/kyc')}
          className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Voltar para lista
        </button>
      </div>

      {/* User Info Header */}
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Usuário</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{kyc.User?.name || kyc.User?.email}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{kyc.User?.email}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Submetido: {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString('pt-PT') : 'N/A'}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold ${statusClasses(kyc.status)}`}>
              {kyc.status}
            </span>
            {kyc.reviewer && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Revisor: {kyc.reviewer}</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      {renderSection('Dados Pessoais', personalFields)}

      {/* Documents Section with View and Download */}
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          Documentos Enviados
        </h3>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Nenhum documento enviado.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{doc.type}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{doc.originalName}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <a
                      href={resolveUrl(doc.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </a>
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Baixar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ID Documents Information */}
      {renderSection('Documentos de Identificação', documentFields)}

      {/* Contact Information */}
      {renderSection('Informações de Contato', contactFields)}

      {/* Address Information */}
      {renderSection('Endereço', addressFields)}

      {/* Business Information */}
      {kyc.businessName && renderSection('Informações Empresariais', businessFields)}

      {/* Financial Information */}
      {renderSection('Informações Financeiras', financialFields)}

      {/* Banking Information */}
      {kyc.bankName && renderSection('Dados Bancários', bankingFields)}

      {/* Review and Approval Section */}
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          Revisão e Aprovação
        </h3>
        
        <div className="space-y-4">
          {/* Status Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Status Atual</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{kyc.status}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Revisor</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{kyc.reviewer || 'Não atribuído'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Data de Submissão</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString('pt-PT') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Approval Info */}
          {kyc.approvedAt && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="text-xs uppercase tracking-[0.32em] text-emerald-600 dark:text-emerald-400">Aprovado em</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {new Date(kyc.approvedAt).toLocaleString('pt-PT')}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {kyc.rejectionReason && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20">
              <p className="text-xs uppercase tracking-[0.32em] text-rose-600 dark:text-rose-400">Motivo da Rejeição</p>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{kyc.rejectionReason}</p>
            </div>
          )}

          {/* Review Actions */}
          {kyc.status === 'PENDING' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Motivo de rejeição (obrigatório para rejeitar)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Informe o motivo caso esteja rejeitando o pedido"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleReview('APPROVED')}
                  disabled={saving}
                  className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprovar KYC
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleReview('REJECTED')}
                  disabled={saving}
                  className="rounded-3xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rejeitar KYC
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {kyc.status !== 'PENDING' && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Este KYC já foi {kyc.status === 'APPROVED' ? 'aprovado' : 'rejeitado'} e não pode ser revisado novamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminKycDetail;