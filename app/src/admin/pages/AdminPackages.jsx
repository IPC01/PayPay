import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';

const initialForm = {
  id: null,
  code: '',
  name: '',
  price: '',
  promoPrice: '',
  promoStartDate: '',
  promoEndDate: '',
  permissionsGranted: '',
  permissionsDenied: '',
  description: '',
  isFree: false,
  active: true
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN'
  });
}

function AdminPackages() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { confirm } = useConfirmation();
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/packages');
      setPackages(data);
      setSelectedPackage((current) =>
        current ? data.find((p) => p.id === current.id) || current : null
      );
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar pacotes',
        message: 'Não foi possível carregar os pacotes. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddPackage = () => {
    setForm(initialForm);
    setSelectedPackage(null);
    setShowForm(true);
  };

  const handleEdit = (event, pack) => {
    if (event) event.stopPropagation();
    setForm({
      id: pack.id,
      code: pack.code || '',
      name: pack.name || '',
      price: pack.price != null ? String(pack.price) : '',
      promoPrice: pack.promoPrice != null ? String(pack.promoPrice) : '',
      promoStartDate: pack.promoStartDate ? String(pack.promoStartDate).slice(0, 10) : '',
      promoEndDate: pack.promoEndDate ? String(pack.promoEndDate).slice(0, 10) : '',
      permissionsGranted: pack.permissionsGranted || '',
      permissionsDenied: pack.permissionsDenied || '',
      description: pack.description || '',
      isFree: Boolean(pack.isFree),
      active: Boolean(pack.active)
    });
    setSelectedPackage(null);
    setShowForm(true);
  };

  const handleDelete = async (event, pack) => {
    if (event) event.stopPropagation();
    if (!(await confirm({
      title: 'Remover pacote',
      message: `Tem certeza de que deseja remover o pacote ${pack.name}?`,
      confirmLabel: 'Remover pacote'
    }))) return;

    try {
      setDeletingId(pack.id);
      await authRequest(`/api/admin/packages/${pack.id}`, { method: 'DELETE' });
      notify({
        type: 'success',
        title: 'Pacote removido',
        message: `O pacote ${pack.name} foi removido com sucesso.`
      });
      setSelectedPackage(null);
      await loadPackages();
      setForm(initialForm);
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao remover pacote',
        message: 'Não foi possível remover o pacote. Tente novamente.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.code || !form.name || form.price === '') {
      notify({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha código, nome e preço do pacote.'
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: form.id,
        code: form.code,
        name: form.name,
        price: parseFloat(String(form.price).replace(',', '.')) || 0,
        promoPrice: form.promoPrice
          ? parseFloat(String(form.promoPrice).replace(',', '.'))
          : null,
        promoStartDate: form.promoStartDate || null,
        promoEndDate: form.promoEndDate || null,
        description: form.description || null,
        permissionsGranted: form.permissionsGranted || null,
        permissionsDenied: form.permissionsDenied || null,
        isFree: Boolean(form.isFree),
        active: Boolean(form.active)
      };

      const response = await authRequest('/api/admin/packages', {
        method: 'POST',
        body: payload
      });

      const actionText = form.id ? 'atualizado' : 'criado';
      notify({
        type: 'success',
        title: 'Pacote salvo',
        message: `O pacote ${response.name} foi ${actionText} com sucesso.`
      });

      setForm(initialForm);
      setShowForm(false);
      await loadPackages();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao guardar pacote',
        message: 'Não foi possível guardar o pacote. Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setShowForm(false);
  };

  const handleRowKeyDown = (event, pack) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedPackage(pack);
    }
  };

  // ── Detalhe compacto interno ──────────────────────────────────────────────
  const PackageDetailsCard = ({ pack, onClose }) => {
    if (!pack) return null;

    const InfoTile = ({ label, children }) => (
      <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
          {children}
        </div>
      </div>
    );

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
              Detalhes do Pacote
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
              {pack.name}
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Código: {pack.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Fechar detalhes"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="space-y-3 px-4 py-3">
          {/* Preço destacado */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Preço</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(pack.price)}
              </p>
              {pack.promoPrice != null && Number(pack.promoPrice) > 0 && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Promo: {formatCurrency(pack.promoPrice)}
                </p>
              )}
            </div>
            {(pack.promoStartDate || pack.promoEndDate) && (
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {pack.promoStartDate
                  ? new Date(pack.promoStartDate).toLocaleDateString('pt-PT')
                  : '—'}{' '}
                →{' '}
                {pack.promoEndDate
                  ? new Date(pack.promoEndDate).toLocaleDateString('pt-PT')
                  : '—'}
              </p>
            )}
          </div>

          {/* Grid 2x2 */}
          <div className="grid grid-cols-2 gap-2">
            <InfoTile label="Tipo">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  pack.isFree
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                }`}
              >
                {pack.isFree ? 'Gratuito' : 'Pago'}
              </span>
            </InfoTile>
            <InfoTile label="Estado">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  pack.active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {pack.active ? 'Ativo' : 'Inativo'}
              </span>
            </InfoTile>
          </div>

          {/* Permissões */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Concedidas</p>
              <p className="mt-1 break-words text-xs text-slate-700 dark:text-slate-300">
                {pack.permissionsGranted || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Negadas</p>
              <p className="mt-1 break-words text-xs text-slate-700 dark:text-slate-300">
                {pack.permissionsDenied || '—'}
              </p>
            </div>
          </div>

          {/* Descrição */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Descrição</p>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
              {pack.description || 'Sem descrição'}
            </p>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end dark:border-slate-700">
          <button
            type="button"
            onClick={(event) => handleDelete(event, pack)}
            disabled={deletingId === pack.id}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingId === pack.id ? 'Removendo...' : 'Remover'}
          </button>
          <button
            type="button"
            onClick={(event) => handleEdit(event, pack)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Editar pacote
          </button>
        </div>
      </div>
    );
  };

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Gestão de Pacotes
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Crie, edite e remova pacotes de assinatura para a plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!showForm && !selectedPackage && (
            <button
              type="button"
              onClick={handleAddPackage}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Adicionar pacote
            </button>
          )}
          {showForm && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {form.id ? 'Editar pacote' : 'Novo pacote'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {form.id
                  ? 'Atualize os dados do pacote selecionado.'
                  : 'Preencha os dados para criar um novo pacote de assinatura.'}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Secção: Identificação */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Identificação
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Código <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(event) => handleChange('code', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nome <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* Secção: Preços */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Preços
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preço (MZN) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(event) => handleChange('price', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preço Promo (MZN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.promoPrice}
                    onChange={(event) => handleChange('promoPrice', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Início da promoção
                  </label>
                  <input
                    type="date"
                    value={form.promoStartDate}
                    onChange={(event) => handleChange('promoStartDate', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fim da promoção
                  </label>
                  <input
                    type="date"
                    value={form.promoEndDate}
                    onChange={(event) => handleChange('promoEndDate', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* Secção: Permissões */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Permissões
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Concedidas
                  </label>
                  <textarea
                    value={form.permissionsGranted}
                    onChange={(event) => handleChange('permissionsGranted', event.target.value)}
                    rows={3}
                    placeholder="Ex: basic_access,transaction_history"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Negadas
                  </label>
                  <textarea
                    value={form.permissionsDenied}
                    onChange={(event) => handleChange('permissionsDenied', event.target.value)}
                    rows={3}
                    placeholder="Ex: priority_support,advanced_reports"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* Secção: Descrição */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Descrição
              </h3>
              <textarea
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </section>

            {/* Secção: Estado */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Configuração
              </h3>
              <label className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(event) => handleChange('isFree', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Pacote gratuito (sem pagamento, apenas confirmação de ativação)
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => handleChange('active', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Pacote ativo (visível para os clientes)
                </span>
              </label>
            </section>

            {/* Ações */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-700">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Guardando...' : form.id ? 'Atualizar pacote' : 'Criar pacote'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Detalhe de pacote selecionado */}
      {!showForm && selectedPackage && (
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Pacote selecionado</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {selectedPackage.name} · {selectedPackage.code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPackage(null)}
              className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ← Voltar à lista
            </button>
          </div>

          <div className="max-w-xl">
            <PackageDetailsCard
              pack={selectedPackage}
              onClose={() => setSelectedPackage(null)}
            />
          </div>
        </div>
      )}

      {/* Lista */}
      {!showForm && !selectedPackage && (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Pacotes existentes
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Clique num pacote para ver os detalhes.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {packages.length}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              A carregar pacotes...
            </div>
          ) : packages.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              Nenhum pacote encontrado.
            </div>
          ) : (
            <>
              {/* Tabela (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                  <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Preço</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                    {packages.map((pack) => (
                      <tr
                        key={pack.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedPackage(pack)}
                        onKeyDown={(event) => handleRowKeyDown(event, pack)}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {pack.code}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {pack.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatCurrency(pack.price)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              pack.isFree
                                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                            }`}
                          >
                            {pack.isFree ? 'Gratuito' : 'Pago'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              pack.active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {pack.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedPackage(pack);
                              }}
                              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={(event) => handleEdit(event, pack)}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(event) => handleDelete(event, pack)}
                              disabled={deletingId === pack.id}
                              className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === pack.id ? 'Removendo...' : 'Remover'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {packages.map((pack) => (
                  <div
                    key={pack.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPackage(pack)}
                    onKeyDown={(event) => handleRowKeyDown(event, pack)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {pack.name}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {pack.code}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          pack.active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pack.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Preço</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(pack.price)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Tipo</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {pack.isFree ? 'Gratuito' : 'Pago'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedPackage(pack);
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        Detalhes
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleEdit(event, pack)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleDelete(event, pack)}
                        disabled={deletingId === pack.id}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === pack.id ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPackages;