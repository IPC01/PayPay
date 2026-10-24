import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { assetUrl } from '../../services/api';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

const initialKycState = {
  type: 'INDIVIDUAL',
  status: 'DRAFT',
  submittedAt: null,
  approvedAt: null,
  reviewer: null,
  rejectionReason: null,
  phonePrimary: '',
  phoneSecondary: '',
  contactEmail: '',
  address: '',
  country: '',
  province: '',
  district: '',
  city: '',
  neighborhood: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  sourceOfFunds: '',
  accountPurpose: '',
  monthlyVolume: '',
  annualVolume: '',
  originOfFunds: '',
  mainOperationCountry: '',
  termsAccepted: false,
  firstName: '',
  lastName: '',
  otherNames: '',
  gender: '',
  dateOfBirth: '',
  nationality: '',
  documentType: 'BI',
  documentNumber: '',
  documentIssuedAt: '',
  documentExpiresAt: '',
  documentIssuer: '',
  nuit: '',
  occupation: '',
  employer: '',
  jobTitle: '',
  selfieValidated: false,
  documentValidated: false,
  addressValidated: false,
  businessName: '',
  tradeName: '',
  companyNuit: '',
  registrationNumber: '',
  registrationDate: '',
  legalForm: '',
  economicSector: '',
  activityDescription: '',
  website: '',
  socialLinks: '',
  businessEmail: '',
  businessPhone: '',
  bankName: '',
  iban: '',
  companyMonthlyVolume: '',
  companyAnnualVolume: '',
  beneficialOwnerName: '',
  beneficialOwnerNationality: '',
  beneficialOwnerDob: '',
  beneficialOwnerDocumentNumber: '',
  beneficialOwnerShare: ''
};

const KYC_DOCUMENT_TYPE = 'BI e NUIT (scan)';

const kycSteps = [
  { number: 1, label: 'Tipo' },
  { number: 2, label: 'Dados básicos' },
  { number: 3, label: 'Endereço' },
  { number: 4, label: 'Compliance' },
  { number: 5, label: 'Documentos' },
  { number: 6, label: 'Revisão' }
];

const STATUS_STYLES = {
  DRAFT: { label: 'Rascunho', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  PENDING: { label: 'Em análise', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' },
  APPROVED: { label: 'Aprovado', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' },
  REJECTED: { label: 'Rejeitado', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' }
};

function Kyc() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [kyc, setKyc] = useState(initialKycState);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Guarda o último KYC carregado para não sobrescrever edições do formulário
  const lastLoadedKycRef = useRef(null);

  useEffect(() => {
    loadKyc();
  }, []);

  const loadKyc = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await authRequest('/api/kyc');
      if (response.kyc) {
        const previousLoaded = lastLoadedKycRef.current;
        lastLoadedKycRef.current = response.kyc;
        setKyc((current) => {
          // Na sincronização silenciosa, não sobrescreve dados já editados
          if (silent && JSON.stringify(current) !== JSON.stringify(previousLoaded)) {
            return current;
          }
          return response.kyc;
        });
        const docsResponse = await authRequest('/api/kyc/documents');
        setDocuments(docsResponse.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página
  // e sem alterar campos que o utilizador esteja a preencher.
  useAutoRefresh(() => loadKyc(true));

  const isFilled = (value) => {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;
    return String(value).trim() !== '';
  };

  const getRequiredFieldsForStep = (stepNumber) => {
    const stepFields = {
      1: ['type'],
      2:
        kyc.type === 'INDIVIDUAL'
          ? ['firstName', 'lastName', 'dateOfBirth', 'nationality', 'documentNumber']
          : ['businessName', 'companyNuit', 'registrationNumber', 'legalForm'],
      3: ['country', 'city', 'address'],
      4: ['sourceOfFunds', 'accountPurpose', 'monthlyVolume', 'annualVolume'],
      5: ['documents'],
      6: ['termsAccepted']
    };
    return stepFields[stepNumber] || [];
  };

  const isStepComplete = (stepNumber) => {
    if (stepNumber === 5) return documents.length > 0;
    return getRequiredFieldsForStep(stepNumber).every((field) => isFilled(kyc[field]));
  };

  const getFirstIncompleteStep = () => {
    for (const stepItem of kycSteps) {
      if (!isStepComplete(stepItem.number)) return stepItem.number;
    }
    return kycSteps.length;
  };

  useEffect(() => {
    const firstIncomplete = getFirstIncompleteStep();
    if (step > firstIncomplete) setStep(firstIncomplete);
  }, [kyc, documents, step]);

  useEffect(() => {
    const composedAddress = [
      kyc.street,
      kyc.houseNumber,
      kyc.neighborhood,
      kyc.city,
      kyc.district,
      kyc.province,
      kyc.country
    ]
      .filter((part) => part && String(part).trim() !== '')
      .join(', ');

    if (composedAddress && composedAddress !== kyc.address) {
      setKyc((prev) => ({ ...prev, address: composedAddress }));
    }
  }, [
    kyc.street,
    kyc.houseNumber,
    kyc.neighborhood,
    kyc.city,
    kyc.district,
    kyc.province,
    kyc.country,
    kyc.address
  ]);

  const canAccessStep = (stepNumber) => stepNumber <= getFirstIncompleteStep();
  const canAdvanceCurrentStep = () => isStepComplete(step);

  const goToStep = (nextStep) => {
    if (canAccessStep(nextStep)) return setStep(nextStep);
    notify({
      type: 'warning',
      title: 'Etapa bloqueada',
      message: 'Complete os passos anteriores antes de avançar.'
    });
  };

  const handleNextStep = async () => {
    if (!canAdvanceCurrentStep()) {
      notify({
        type: 'warning',
        title: 'Etapa incompleta',
        message: 'Preencha esta etapa antes de continuar.'
      });
      return;
    }
    await saveDraft();
    if (step < kycSteps.length) setStep((prev) => Math.min(prev + 1, kycSteps.length));
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const saveDraft = async () => {
    try {
      await authRequest('/api/kyc', { method: 'POST', body: kyc });
      notify({
        type: 'success',
        title: 'Rascunho salvo',
        message: 'As informações do KYC foram salvas.'
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Não foi possível salvar o rascunho.'
      });
    }
  };

  const handleSubmit = async () => {
    if (!kyc.termsAccepted) {
      notify({
        type: 'error',
        title: 'Termos não aceitos',
        message: 'Você deve aceitar os termos do KYC antes de submeter.'
      });
      return;
    }

    if (!kyc.dateOfBirth) {
      notify({
        type: 'error',
        title: 'Data de nascimento necessária',
        message: 'Por favor, informe sua data de nascimento.'
      });
      setStep(2);
      return;
    }

    const birthDate = new Date(kyc.dateOfBirth);
    const adultDate = new Date();
    adultDate.setFullYear(adultDate.getFullYear() - 18);
    if (birthDate > adultDate) {
      notify({
        type: 'error',
        title: 'Idade inválida',
        message: 'Você precisa ter pelo menos 18 anos para completar o KYC.'
      });
      setStep(2);
      return;
    }

    try {
      await saveDraft();
      await authRequest('/api/kyc/submit', { method: 'POST' });
      notify({
        type: 'success',
        title: 'KYC enviado',
        message: 'Seu KYC foi submetido para revisão.'
      });
      loadKyc();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao submeter',
        message: err.message || 'Não foi possível submeter o KYC.'
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      notify({
        type: 'error',
        title: 'Arquivo não selecionado',
        message: 'Escolha um ficheiro para enviar.'
      });
      return;
    }
    if (uploadFile.type !== 'application/pdf') {
      notify({
        type: 'error',
        title: 'Formato inválido',
        message: 'Submeta o scan do documento em formato PDF.'
      });
      return;
    }

    try {
      setUploading(true);
      let kycData = kyc;
      if (!kycData.id) {
        const saved = await authRequest('/api/kyc', { method: 'POST', body: kycData });
        kycData = saved.kyc;
        setKyc(kycData);
      }
      const base64 = await toBase64(uploadFile);
      const response = await authRequest('/api/kyc/documents', {
        method: 'POST',
        body: {
          kycId: kycData.id,
          type: KYC_DOCUMENT_TYPE,
          file: base64,
          fileName: uploadFile.name
        }
      });
      setDocuments((prev) => [...prev, response.document]);
      setUploadFile(null);
      notify({
        type: 'success',
        title: 'Documento enviado',
        message: 'O documento de KYC foi enviado com sucesso.'
      });
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro no envio',
        message: err.message || 'Falha ao enviar o documento.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await authRequest(`/api/kyc/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      notify({
        type: 'success',
        title: 'Documento removido',
        message: 'O documento foi removido com sucesso.'
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Não foi possível remover o documento.'
      });
    }
  };

  const statusBadge = useMemo(
    () => STATUS_STYLES[kyc.status] || STATUS_STYLES.DRAFT,
    [kyc.status]
  );

  const progress = useMemo(() => {
    const completed = kycSteps.filter((item) => isStepComplete(item.number)).length;
    return Math.round((completed / kycSteps.length) * 100);
  }, [kyc, documents]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          Carregando dados do KYC...
        </div>
      </div>
    );
  }

  // ── Componentes auxiliares ────────────────────────────────────────────────
  const Field = ({ label, name, type = 'text', max }) => (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        max={max}
        value={kyc[name] || ''}
        onChange={(e) => setKyc((prev) => ({ ...prev, [name]: e.target.value }))}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>
  );

  const SelectField = ({ label, name, options }) => (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <select
        value={kyc[name] || ''}
        onChange={(e) => setKyc((prev) => ({ ...prev, [name]: e.target.value }))}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );

  const adultMaxDate = new Date(
    new Date().setFullYear(new Date().getFullYear() - 18)
  )
    .toISOString()
    .split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
          Verificação
        </p>
      </div>

      {/* Progresso + Status */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Progresso
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {progress}% concluído
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        </div>
        <div className="mt-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 h-2">
          <div
            className="h-2 rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Motivo de rejeição */}
      {kyc.status === 'REJECTED' && kyc.rejectionReason && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
            Motivo da rejeição
          </p>
          <p className="mt-1">{kyc.rejectionReason}</p>
        </div>
      )}

      {/* Stepper mobile (chips horizontais) */}
      <div className="-mx-1 overflow-x-auto lg:hidden">
        <div className="flex gap-2 px-1 pb-1">
          {kycSteps.map((item) => {
            const accessible = canAccessStep(item.number);
            const active = step === item.number;
            const complete = isStepComplete(item.number);
            return (
              <button
                key={item.number}
                type="button"
                onClick={() => goToStep(item.number)}
                disabled={!accessible}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : complete
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-200'
                      : accessible
                        ? 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                        : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                }`}
              >
                {complete && !active ? '✓ ' : `${item.number}. `}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Passos
          </p>
          <div className="mt-3 space-y-1.5">
            {kycSteps.map((item) => {
              const accessible = canAccessStep(item.number);
              const active = step === item.number;
              const complete = isStepComplete(item.number);
              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => goToStep(item.number)}
                  disabled={!accessible}
                  aria-current={active ? 'step' : undefined}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-white'
                      : accessible
                        ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                        : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                  }`}
                >
                  <span className="truncate">
                    {item.number}. {item.label}
                  </span>
                  <span
                    className={`ml-2 shrink-0 text-[10px] font-bold ${
                      complete
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {complete ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Conteúdo */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Escolha o tipo de KYC
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {['INDIVIDUAL', 'BUSINESS'].map((option) => {
                  const selected = kyc.type === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setKyc((prev) => ({ ...prev, type: option }))}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {option === 'INDIVIDUAL' ? 'Pessoa Física' : 'Empresa'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {option === 'INDIVIDUAL'
                          ? 'Informações pessoais e documentos de identificação.'
                          : 'Dados de empresa, registo comercial e UBO.'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Dados básicos
              </h2>
              {kyc.type === 'INDIVIDUAL' ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Nome próprio" name="firstName" />
                  <Field label="Apelido" name="lastName" />
                  <Field label="Outros nomes" name="otherNames" />
                  <Field label="Telefone principal" name="phonePrimary" />
                  <Field label="Telefone secundário" name="phoneSecondary" />
                  <Field label="Email alternativo" name="contactEmail" />
                  <SelectField
                    label="Sexo"
                    name="gender"
                    options={[
                      { value: '', label: 'Selecione' },
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Feminino', label: 'Feminino' },
                      { value: 'Outro', label: 'Outro' },
                      { value: 'Prefiro não dizer', label: 'Prefiro não dizer' }
                    ]}
                  />
                  <Field
                    label="Data de nascimento"
                    name="dateOfBirth"
                    type="date"
                    max={adultMaxDate}
                  />
                  <Field label="Nacionalidade" name="nationality" />
                  <SelectField
                    label="Tipo de documento"
                    name="documentType"
                    options={[
                      { value: 'BI', label: 'BI' },
                      { value: 'PASSAPORTE', label: 'Passaporte' },
                      { value: 'DIRE', label: 'DIRE' }
                    ]}
                  />
                  <Field label="Número documento" name="documentNumber" />
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Razão social" name="businessName" />
                  <Field label="Nome comercial" name="tradeName" />
                  <Field label="NUIT" name="companyNuit" />
                  <Field label="N.º de registo comercial" name="registrationNumber" />
                  <Field label="Data de constituição" name="registrationDate" type="date" />
                  <Field label="Forma jurídica" name="legalForm" />
                  <Field label="Setor económico" name="economicSector" />
                  <Field label="Website" name="website" />
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Endereço
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="País" name="country" />
                <Field label="Província" name="province" />
                <Field label="Distrito" name="district" />
                <Field label="Cidade/Vila" name="city" />
                <Field label="Bairro" name="neighborhood" />
                <Field label="Avenida/Rua" name="street" />
                <Field label="Número/Casa" name="houseNumber" />
                <Field label="Código Postal" name="postalCode" />
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Compliance
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Fonte de rendimentos" name="sourceOfFunds" />
                <Field label="Finalidade da conta" name="accountPurpose" />
                <Field label="Volume mensal esperado" name="monthlyVolume" />
                <Field label="Volume anual esperado" name="annualVolume" />
                <Field label="Origem dos fundos" name="originOfFunds" />
                <Field label="País principal de operação" name="mainOperationCountry" />
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Upload de documentos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submeta um único scan em PDF com o seu BI e o NUIT.
              </p>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-4 text-center">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                  <svg
                    className="h-8 w-8 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {uploadFile ? uploadFile.name : 'Selecionar scan em PDF'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Apenas formato PDF (BI + NUIT)
                  </p>
                </label>

                {uploadFile && (
                  <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setUploadFile(null)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Remover
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploading ? 'A enviar...' : 'Enviar documento'}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Documentos enviados ({documents.length})
                </p>
                {documents.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Nenhum documento enviado ainda.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                            {doc.type}
                          </p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {doc.originalName}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <a
                            href={assetUrl(doc.url) || doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                          >
                            Ver
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6 */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Revisão
              </h2>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verifique todos os dados antes de submeter o seu KYC.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    {
                      label: 'Tipo',
                      value: kyc.type === 'INDIVIDUAL' ? 'Pessoa Física' : 'Empresa'
                    },
                    {
                      label: 'Contacto',
                      value: `${kyc.contactEmail || 'Sem email'} · ${kyc.phonePrimary || 'Sem telefone'}`
                    },
                    { label: 'Endereço', value: kyc.address || 'Sem endereço' },
                    {
                      label: 'Volume anual previsto',
                      value: kyc.annualVolume || 'Não informado'
                    }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-white px-3 py-2 dark:bg-slate-800"
                    >
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-0.5 break-words text-xs font-semibold text-slate-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={kyc.termsAccepted}
                  onChange={(e) =>
                    setKyc((prev) => ({ ...prev, termsAccepted: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Aceito os termos e condições do processo de validação KYC.
                </span>
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Submeter para aprovação
                </button>
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between dark:border-slate-700">
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-900/20 dark:text-brand-300"
            >
              Guardar rascunho
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Voltar
                </button>
              )}
              {step < kycSteps.length && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canAdvanceCurrentStep()}
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Próximo
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Kyc;