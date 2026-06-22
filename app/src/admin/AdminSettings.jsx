import { useEffect, useState } from 'react';
import { API_BASE } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

function normalizeImageUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) {
    const scheme = API_BASE.startsWith('https') ? 'https:' : 'http:';
    return `${scheme}${url}`;
  }
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

const TRANSACTION_TYPES = [
  { value: 'c2b', label: 'C2B' },
  { value: 'b2c', label: 'B2C' }
];

function AdminSettings() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState({
    platformName: '',
    logoImg: '',
    contacts: '',
    address: '',
    emails: '',
    ownerName: '',
    additionalInfo: '',
    withdrawalFeePercent: '',
    withdrawalMinValue: '',
    withdrawalMaxValue: ''
  });
  const [fees, setFees] = useState([]);
  const [walletTypes, setWalletTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feesLoading, setFeesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFees, setSavingFees] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setFeesLoading(true);

    try {
      const data = await authRequest('/api/admin/settings');
      setSettings({
        platformName: data.platformName || '',
        logoImg: data.logoImg || '',
        contacts: data.contacts || '',
        address: data.address || '',
        emails: data.emails || '',
        ownerName: data.ownerName || '',
        additionalInfo: data.additionalInfo || '',
        withdrawalFeePercent: data.withdrawalFeePercent != null ? String(data.withdrawalFeePercent) : '',
        withdrawalMinValue: data.withdrawalMinValue != null ? String(data.withdrawalMinValue) : '',
        withdrawalMaxValue: data.withdrawalMaxValue != null ? String(data.withdrawalMaxValue) : ''
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar definições',
        message: 'Não foi possível carregar as definições da plataforma.'
      });
    } finally {
      setLoading(false);
    }

    try {
      const [feesData, walletTypeData] = await Promise.all([
        authRequest('/api/admin/transaction-fees'),
        authRequest('/api/wallet-types')
      ]);

      setFees(
        feesData.map((fee) => ({
          ...fee,
          feePercent: fee.feePercent != null ? String(fee.feePercent) : ''
        }))
      );
      setWalletTypes(walletTypeData);
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar taxas',
        message: 'Não foi possível carregar as taxas de transação.'
      });
    } finally {
      setFeesLoading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const data = await authRequest('/api/admin/settings', {
        method: 'POST',
        body: settings
      });
      setSettings({
        platformName: data.platformName || '',
        logoImg: data.logoImg || '',
        contacts: data.contacts || '',
        address: data.address || '',
        emails: data.emails || '',
        ownerName: data.ownerName || '',
        additionalInfo: data.additionalInfo || '',
        withdrawalFeePercent: data.withdrawalFeePercent != null ? String(data.withdrawalFeePercent) : '',
        withdrawalMinValue: data.withdrawalMinValue != null ? String(data.withdrawalMinValue) : '',
        withdrawalMaxValue: data.withdrawalMaxValue != null ? String(data.withdrawalMaxValue) : '',
        withdrawalFeePercent: data.withdrawalFeePercent != null ? String(data.withdrawalFeePercent) : '',
        withdrawalMinValue: data.withdrawalMinValue != null ? String(data.withdrawalMinValue) : '',
        withdrawalMaxValue: data.withdrawalMaxValue != null ? String(data.withdrawalMaxValue) : ''
      });
      notify({
        type: 'success',
        title: 'Definições salvas',
        message: 'As definições da plataforma foram atualizadas com sucesso.'
      });
      refreshSettings();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao salvar definições',
        message: 'Não foi possível guardar as definições. Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFees = async () => {
    if (!walletTypes.length) {
      notify({
        type: 'error',
        title: 'Sem tipos de carteira',
        message: 'Não há tipos de carteira carregados para definir as taxas.'
      });
      return;
    }

    const normalizedFees = fees.map((fee) => ({
      ...fee,
      feePercent: String(fee.feePercent).replace(',', '.')
    }));

    const invalidRow = normalizedFees.some(
      (fee) => !fee.walletTypeId || !fee.type || fee.feePercent === '' || Number.isNaN(parseFloat(fee.feePercent))
    );

    if (invalidRow) {
      notify({
        type: 'error',
        title: 'Campos em falta',
        message: 'Preencha todos os campos de cada taxa antes de guardar.'
      });
      return;
    }

    try {
      setSavingFees(true);
      const saved = await authRequest('/api/admin/transaction-fees', {
        method: 'POST',
        body: { fees: normalizedFees }
      });
      setFees(
        saved.map((fee) => ({
          ...fee,
          feePercent: fee.feePercent != null ? String(fee.feePercent) : ''
        }))
      );
      notify({
        type: 'success',
        title: 'Taxas salvas',
        message: 'As taxas de transação foram atualizadas com sucesso.'
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao guardar taxas',
        message: 'Não foi possível guardar as taxas de transação. Tente novamente.'
      });
    } finally {
      setSavingFees(false);
    }
  };

  const removeFeeRow = async (index) => {
    const fee = fees[index];
    if (!fee) return;

    if (fee.id) {
      try {
        await authRequest(`/api/admin/transaction-fees/${fee.id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        notify({
          type: 'error',
          title: 'Erro ao remover taxa',
          message: 'Não foi possível remover a taxa selecionada.'
        });
        return;
      }
    }

    setFees((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addFeeRow = () => {
    const defaultWalletType = walletTypes[0]?.id || '';
    setFees((prev) => [
      ...prev,
      {
        id: null,
        walletTypeId: defaultWalletType,
        type: 'c2b',
        feePercent: ''
      }
    ]);
  };

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const updateFeeField = (index, field, value) => {
    setFees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Configurações de Pagamentos</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Configurações de Pagamentos</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Atualize as regras de pagamento, taxas e limites de saque para a plataforma.
          </p>
        </div>
      </div>
       <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Taxas de Transação</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Registe, altere e mantenha as taxas de transação por tipo e por carteira.
            </p>
          </div>

          <button
            type="button"
            onClick={addFeeRow}
            disabled={feesLoading || !walletTypes.length}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Adicionar taxa
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {feesLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Carregando taxas de transação...</p>
          ) : fees.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Ainda não existem taxas definidas. Adicione uma nova taxa para começar.</p>
          ) : (
            fees.map((fee, index) => (
              <div
                key={`${fee.id || 'new'}-${index}`}
                className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[2fr_1fr_1fr_auto]"
              >
                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  Carteira
                  <select
                    value={fee.walletTypeId}
                    onChange={(event) => updateFeeField(index, 'walletTypeId', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">Selecione uma carteira</option>
                    {walletTypes.map((walletType) => (
                      <option key={walletType.id} value={walletType.id}>
                        {walletType.name || walletType.code}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  Tipo de Transação
                  <select
                    value={fee.type}
                    onChange={(event) => updateFeeField(index, 'type', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {TRANSACTION_TYPES.map((transactionType) => (
                      <option key={transactionType.value} value={transactionType.value}>
                        {transactionType.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  Percentual (%)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fee.feePercent}
                    onChange={(event) => updateFeeField(index, 'feePercent', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </label>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeFeeRow(index)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Limites e Taxas de Saque</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Defina as regras e limites de valor para pedidos de saque.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm text-slate-700 dark:text-slate-300">
              Taxa de Saque (%)
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.withdrawalFeePercent}
                onChange={(event) => updateField('withdrawalFeePercent', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm text-slate-700 dark:text-slate-300">
              Valor mínimo de saque
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.withdrawalMinValue}
                onChange={(event) => updateField('withdrawalMinValue', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm text-slate-700 dark:text-slate-300">
              Valor máximo de saque
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.withdrawalMaxValue}
                onChange={(event) => updateField('withdrawalMaxValue', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSaveFees}
            disabled={feesLoading || savingFees}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {savingFees ? 'Guardando taxas...' : 'Guardar taxas de transação'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Plataforma</label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(event) => updateField('platformName', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Logo da Plataforma</label>
            <div className="flex flex-col gap-3">
              {settings.logoImg ? (
                <img
                  src={settings.logoImg}
                  alt="Logo da plataforma"
                  className="h-20 w-auto rounded-2xl border border-slate-200 object-contain dark:border-slate-700"
                />
              ) : (
                <div className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  Sem logo carregada
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    if (!reader.result) return;
                    setUploadingLogo(true);
                    try {
                      const response = await authRequest('/api/admin/settings/logo-upload', {
                        method: 'POST',
                        body: {
                          fileName: file.name,
                          data: reader.result
                        }
                      });
                      updateField('logoImg', normalizeImageUrl(response.logoImg));
                      refreshSettings();
                    } catch (error) {
                      notify({
                        type: 'error',
                        title: 'Erro no upload da imagem',
                        message: error.message || 'Não foi possível carregar o logo.'
                      });
                    } finally {
                      setUploadingLogo(false);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:text-white focus:outline-none dark:text-slate-200"
              />
              {uploadingLogo && <p className="text-sm text-slate-500 dark:text-slate-400">Carregando logo...</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Contacto</label>
            <textarea
              value={settings.contacts}
              onChange={(event) => updateField('contacts', event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</label>
            <textarea
              value={settings.address}
              onChange={(event) => updateField('address', event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">E-mails</label>
            <textarea
              value={settings.emails}
              onChange={(event) => updateField('emails', event.target.value)}
              rows={4}
              placeholder="ex: suporte@exemplo.com, admin@exemplo.com"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Proprietário (Opcional)</label>
            <input
              type="text"
              value={settings.ownerName}
              onChange={(event) => updateField('ownerName', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Outras Informações</label>
          <textarea
            value={settings.additionalInfo}
            onChange={(event) => updateField('additionalInfo', event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? 'Guardando...' : 'Guardar definições'}
          </button>
        </div>
      </form>

     
    </div>
  );
}

export default AdminSettings;
