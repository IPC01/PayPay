import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

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

const individualDocuments = [
  'BI (frente)',
  'BI (verso)',
  'Foto tipo passe',
  'Comprovativo de residência'
];

const businessDocuments = [
  'Certidão Comercial',
  'NUIT Empresa',
  'Alvará',
  'BI do Director'
];

const kycSteps = [
  { number: 1, label: 'Tipo' },
  { number: 2, label: 'Dados básicos' },
  { number: 3, label: 'Endereço' },
  { number: 4, label: 'Compliance' },
  { number: 5, label: 'Documentos' },
  { number: 6, label: 'Revisão' }
];

function Kyc() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [kyc, setKyc] = useState(initialKycState);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [uploadType, setUploadType] = useState(individualDocuments[0]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadKyc();
  }, []);

  const loadKyc = async () => {
    try {
      setLoading(true);
      const response = await authRequest('/api/kyc');
      if (response.kyc) {
        setKyc(response.kyc);
        const docsResponse = await authRequest('/api/kyc/documents');
        setDocuments(docsResponse.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isFilled = (value) => {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;
    return String(value).trim() !== '';
  };

  const getRequiredFieldsForStep = (stepNumber) => {
    const stepFields = {
      1: ['type'],
      2: kyc.type === 'INDIVIDUAL'
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
    if (stepNumber === 5) {
      return documents.length > 0;
    }

    return getRequiredFieldsForStep(stepNumber).every((field) => isFilled(kyc[field]));
  };

  const getFirstIncompleteStep = () => {
    for (const stepItem of kycSteps) {
      if (!isStepComplete(stepItem.number)) {
        return stepItem.number;
      }
    }

    return kycSteps.length;
  };

  useEffect(() => {
    const firstIncompleteStep = getFirstIncompleteStep();
    if (step > firstIncompleteStep) {
      setStep(firstIncompleteStep);
    }
  }, [kyc, documents, step]);

  const canAccessStep = (stepNumber) => stepNumber <= getFirstIncompleteStep();

  const goToStep = (nextStep) => {
    if (canAccessStep(nextStep)) {
      setStep(nextStep);
      return;
    }

    notify({
      type: 'warning',
      title: 'Etapa bloqueada',
      message: 'Complete os passos anteriores antes de avançar.'
    });
  };

  const canAdvanceCurrentStep = () => isStepComplete(step);

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
    if (step < kycSteps.length) {
      setStep((prev) => Math.min(prev + 1, kycSteps.length));
    }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const saveDraft = async () => {
    try {
      await authRequest('/api/kyc', {
        method: 'POST',
        body: kyc
      });
      notify({ type: 'success', title: 'Rascunho salvo', message: 'As informações do KYC foram salvas.' });
    } catch (err) {
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível salvar o rascunho.' });
    }
  };

  const handleSubmit = async () => {
    if (!kyc.termsAccepted) {
      notify({ type: 'error', title: 'Termos não aceitos', message: 'Você deve aceitar os termos do KYC antes de submeter.' });
      return;
    }

    if (!kyc.dateOfBirth) {
      notify({ type: 'error', title: 'Data de nascimento necessária', message: 'Por favor, informe sua data de nascimento.' });
      setStep(2);
      return;
    }

    const birthDate = new Date(kyc.dateOfBirth);
    const adultDate = new Date();
    adultDate.setFullYear(adultDate.getFullYear() - 18);
    if (birthDate > adultDate) {
      notify({ type: 'error', title: 'Idade inválida', message: 'Você precisa ter pelo menos 18 anos para completar o KYC.' });
      setStep(2);
      return;
    }

    try {
      await saveDraft();
      await authRequest('/api/kyc/submit', {
        method: 'POST'
      });
      notify({ type: 'success', title: 'KYC enviado', message: 'Seu KYC foi submetido para revisão.' });
      loadKyc();
    } catch (err) {
      notify({ type: 'error', title: 'Erro ao submeter', message: err.message || 'Não foi possível submeter o KYC.' });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      notify({ type: 'error', title: 'Arquivo não selecionado', message: 'Escolha um ficheiro para enviar.' });
      return;
    }

    try {
      setUploading(true);
      let kycData = kyc;
      if (!kycData.id) {
        const saved = await authRequest('/api/kyc', {
          method: 'POST',
          body: kycData
        });
        kycData = saved.kyc;
        setKyc(kycData);
      }
      const base64 = await toBase64(uploadFile);
      const response = await authRequest('/api/kyc/documents', {
        method: 'POST',
        body: {
          kycId: kycData.id,
          type: uploadType,
          file: base64,
          fileName: uploadFile.name
        }
      });
      setDocuments((prev) => [...prev, response.document]);
      setUploadFile(null);
      notify({ type: 'success', title: 'Documento enviado', message: 'O documento de KYC foi enviado com sucesso.' });
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro no envio', message: err.message || 'Falha ao enviar o documento.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await authRequest(`/api/kyc/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      notify({ type: 'success', title: 'Documento removido', message: 'O documento foi removido com sucesso.' });
    } catch (err) {
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível remover o documento.' });
    }
  };

  const statusBadge = useMemo(() => {
    const config = {
      DRAFT: { label: 'Rascunho', className: 'bg-slate-100 text-slate-800' },
      PENDING: { label: 'Em análise', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' }
    };
    return config[kyc.status] || config.DRAFT;
  }, [kyc.status]);

  const calculateProgress = () => {
    const completedSteps = kycSteps.filter((item) => isStepComplete(item.number)).length;
    return Math.round((completedSteps / kycSteps.length) * 100);
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center text-slate-600 dark:text-slate-300">Carregando dados do KYC...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Progresso do KYC</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{progress}% completo</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${statusBadge.className}`}>
            <span>{statusBadge.label}</span>
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
          <div 
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Início</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Conclusão</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">KYC</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Complete o processo de verificação KYC para desbloquear carteiras, levantamentos e chaves de API.
          </p>
        </div>
      </div>

      {kyc.status === 'REJECTED' && kyc.rejectionReason && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-950/20 dark:text-red-200">
          Motivo de rejeição: {kyc.rejectionReason}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Progresso</p>
          <div className="mt-6 space-y-3">
            {kycSteps.map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => goToStep(item.number)}
                disabled={!canAccessStep(item.number)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  step === item.number 
                    ? 'border-brand-500 bg-brand-50 text-brand-900 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-white' 
                    : canAccessStep(item.number)
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                      : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                }`}
              >
                <span>{item.number}. {item.label}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isStepComplete(item.number) ? '✓' : item.number}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Escolha o tipo de KYC</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {['INDIVIDUAL', 'BUSINESS'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setKyc((prev) => ({ ...prev, type: option }))}
                    className={`rounded-3xl border p-6 text-left transition ${
                      kyc.type === option 
                        ? 'border-brand-500 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-900/20' 
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
                    } hover:border-brand-300 hover:bg-slate-100 dark:hover:border-brand-500/40 dark:hover:bg-slate-800`}
                  >
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{option === 'INDIVIDUAL' ? 'Pessoa Física' : 'Empresa'}</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {option === 'INDIVIDUAL'
                        ? 'Informações pessoais e documentos de identificação.'
                        : 'Dados de empresa, registo comercial e UBO.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Dados básicos</h2>
              {kyc.type === 'INDIVIDUAL' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: 'Nome próprio', name: 'firstName' },
                    { label: 'Apelido', name: 'lastName' },
                    { label: 'Outros nomes', name: 'otherNames' },
                    { label: 'Telefone principal', name: 'phonePrimary' },
                    { label: 'Telefone secundário', name: 'phoneSecondary' },
                    { label: 'Email alternativo', name: 'contactEmail' },
                    { label: 'Sexo', name: 'gender' },
                    { label: 'Data de nascimento', name: 'dateOfBirth', type: 'date' },
                    { label: 'Nacionalidade', name: 'nationality' },
                    { label: 'Tipo de documento', name: 'documentType' },
                    { label: 'Número documento', name: 'documentNumber' }
                  ].map((field) => (
                    <label key={field.name} className="block text-sm text-slate-700 dark:text-slate-200">
                      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{field.label}</span>
                      {field.name === 'gender' ? (
                        <select
                          value={kyc.gender}
                          onChange={(e) => setKyc((prev) => ({ ...prev, gender: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="">Selecione</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                          <option value="Prefiro não dizer">Prefiro não dizer</option>
                        </select>
                      ) : field.name === 'documentType' ? (
                        <select
                          value={kyc.documentType}
                          onChange={(e) => setKyc((prev) => ({ ...prev, documentType: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="BI">BI</option>
                          <option value="PASSAPORTE">Passaporte</option>
                          <option value="DIRE">DIRE</option>
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          max={field.name === 'dateOfBirth' ? new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0] : undefined}
                          value={kyc[field.name] || ''}
                          onChange={(e) => setKyc((prev) => ({ ...prev, [field.name]: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: 'Razão social', name: 'businessName' },
                    { label: 'Nome comercial', name: 'tradeName' },
                    { label: 'NUIT', name: 'companyNuit' },
                    { label: 'Número de registo comercial', name: 'registrationNumber' },
                    { label: 'Data de constituição', name: 'registrationDate', type: 'date' },
                    { label: 'Forma jurídica', name: 'legalForm' },
                    { label: 'Setor económico', name: 'economicSector' },
                    { label: 'Website', name: 'website' }
                  ].map((field) => (
                    <label key={field.name} className="block text-sm text-slate-700 dark:text-slate-200">
                      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{field.label}</span>
                      <input
                        type={field.type || 'text'}
                        value={kyc[field.name] || ''}
                        onChange={(e) => setKyc((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Endereço</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: 'País', name: 'country' },
                  { label: 'Província', name: 'province' },
                  { label: 'Distrito', name: 'district' },
                  { label: 'Cidade/Vila', name: 'city' },
                  { label: 'Bairro', name: 'neighborhood' },
                  { label: 'Avenida/Rua', name: 'street' },
                  { label: 'Número/Casa', name: 'houseNumber' },
                  { label: 'Código Postal', name: 'postalCode' }
                ].map((field) => (
                  <label key={field.name} className="block text-sm text-slate-700 dark:text-slate-200">
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{field.label}</span>
                    <input
                      type="text"
                      value={kyc[field.name] || ''}
                      onChange={(e) => setKyc((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Compliance</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Fonte de rendimentos', name: 'sourceOfFunds' },
                  { label: 'Finalidade da conta', name: 'accountPurpose' },
                  { label: 'Volume mensal esperado', name: 'monthlyVolume' },
                  { label: 'Volume anual esperado', name: 'annualVolume' },
                  { label: 'Origem dos fundos', name: 'originOfFunds' },
                  { label: 'País principal de operação', name: 'mainOperationCountry' }
                ].map((field) => (
                  <label key={field.name} className="block text-sm text-slate-700 dark:text-slate-200">
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{field.label}</span>
                    <input
                      type="text"
                      value={kyc[field.name] || ''}
                      onChange={(e) => setKyc((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upload de documentos</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-slate-700 dark:text-slate-200">
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Documento</span>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {(kyc.type === 'INDIVIDUAL' ? individualDocuments : businessDocuments).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-700 dark:text-slate-200">
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Ficheiro</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full text-sm text-slate-700 dark:text-slate-200"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? 'A carregar...' : 'Enviar documento'}
              </button>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Documentos enviados</p>
                {documents.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Nenhum documento enviado ainda.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{doc.type}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{doc.originalName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                          >Visualizar</a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                          >Excluir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Revisão</h2>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Verifique todos os dados antes de submeter o seu KYC.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Tipo</p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">{kyc.type === 'INDIVIDUAL' ? 'Pessoa Física' : 'Empresa'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Contacto</p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">{kyc.contactEmail || 'Sem email'} | {kyc.phonePrimary || 'Sem telefone'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Endereço</p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">{kyc.address || 'Sem endereço'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Volume anual previsto</p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">{kyc.annualVolume || 'Não informado'}</p>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={kyc.termsAccepted}
                  onChange={(e) => setKyc((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                />
                Aceito os termos e condições do processo de validação KYC.
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Submeter para aprovação
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-900/20 dark:text-brand-300"
            >
              Guardar rascunho
            </button>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >Voltar</button>
            )}
            {step < 6 && (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!canAdvanceCurrentStep()}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >Próximo</button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Kyc;