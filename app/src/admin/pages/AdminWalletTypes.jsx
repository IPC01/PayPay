import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

const initialForm = {
  id: null,
  code: '',
  name: '',
  provider: '',
  referencePrefix: '',
  isExternal: false
};

function AdminWalletTypes() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await authRequest('/api/wallet-types');
      setTypes(data);
      setSelectedType((current) =>
        current ? data.find((t) => t.id === current.id) || current : null
      );
    } catch (error) {
      if (!silent) {
        notify({
          type: 'error',
          title: 'Erro ao carregar tipos de carteira',
          message: 'Não foi possível carregar os tipos de carteira. Tente novamente.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página.
  // Apenas a lista é atualizada — o formulário permanece intacto.
  useAutoRefresh(() => loadTypes(true));

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setForm(initialForm);
    setSelectedType(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setShowForm(false);
  };

  const handleEdit = (event, type) => {
    if (event) event.stopPropagation();
    setForm({
      id: type.id,
      code: type.code || '',
      name: type.name || '',
      provider: type.provider || '',
      referencePrefix: type.referencePrefix || '',
      isExternal: Boolean(type.isExternal)
    });
    setSelectedType(null);
    setShowForm(true);
  };

  const toggleTypeStatus = async (event, type) => {
    if (event) event.stopPropagation();
    try {
      setStatusLoading(type.id);
      await authRequest(`/api/wallet-types/${type.id}`, {
        method: 'PUT',
        body: { status: !type.status }
      });
      notify({
        type: 'success',
        title: 'Sucesso',
        message: `Tipo de carteira ${type.name} foi ${!type.status ? 'ativado' : 'desativado'} com sucesso.`
      });
      await loadTypes();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o estado do tipo de carteira.'
      });
    } finally {
      setStatusLoading(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.code || !form.name) {
      notify({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha o código e o nome do tipo de carteira.'
      });
      return;
    }

    try {
      setSaving(true);
      await authRequest(form.id ? `/api/wallet-types/${form.id}` : '/api/wallet-types', {
        method: form.id ? 'PUT' : 'POST',
        body: {
          code: form.code,
          name: form.name,
          provider: form.provider || null,
          referencePrefix: form.referencePrefix.trim() || null,
          isExternal: Boolean(form.isExternal)
        }
      });

      notify({
        type: 'success',
        title: form.id ? 'Tipo de carteira atualizado' : 'Tipo de carteira criado',
        message: `O tipo de carteira ${form.name} foi ${form.id ? 'atualizado' : 'criado'} com sucesso.`
      });

      setForm(initialForm);
      setShowForm(false);
      await loadTypes();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao guardar tipo de carteira',
        message: error?.message || 'Não foi possível guardar o tipo de carteira. Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRowKeyDown = (event, type) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedType(type);
    }
  };

  // ── Detalhe compacto interno ──────────────────────────────────────────────
  const TypeDetailsCard = ({ type, onClose }) => {
    if (!type) return null;

    const InfoTile = ({ label, children, span = false }) => (
      <div
        className={`rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900 ${span ? 'col-span-2' : ''}`}
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{children}</div>
      </div>
    );

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
              Detalhes do Tipo
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
              {type.name}
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Código: <span className="font-mono">{type.code}</span>
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
          {/* Grid 2x2 */}
          <div className="grid grid-cols-2 gap-2">
            <InfoTile label="Provedor">{type.provider || 'N/A'}</InfoTile>
            <InfoTile label="Referência">
              <span className="font-mono">{type.referencePrefix || '—'}</span>
            </InfoTile>
            <InfoTile label="Externa">{type.isExternal ? 'Sim' : 'Não'}</InfoTile>
            <InfoTile label="Estado">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  type.status
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {type.status ? 'Ativo' : 'Inativo'}
              </span>
            </InfoTile>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end dark:border-slate-700">
          <button
            type="button"
            onClick={(event) => toggleTypeStatus(event, type)}
            disabled={statusLoading === type.id}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              type.status ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {statusLoading === type.id
              ? 'A processar...'
              : type.status
                ? 'Desativar'
                : 'Ativar'}
          </button>
          <button
            type="button"
            onClick={(event) => handleEdit(event, type)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Editar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Tipos de Carteira
          </h1>
 
        </div>
        <div className="flex items-center gap-3">
          {!showForm && !selectedType && (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Adicionar tipo
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
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {form.id ? 'Editar tipo de carteira' : 'Novo tipo de carteira'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {form.id
                ? 'Altere os dados e guarde para atualizar o tipo.'
                : 'Preencha os dados para criar um novo tipo de carteira.'}
            </p>
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
                    disabled={Boolean(form.id)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
                  />
                  {form.id && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      O código não pode ser alterado após a criação.
                    </p>
                  )}
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

            {/* Secção: Provedor */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Provedor e referência
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Provedor
                  </label>
                  <input
                    type="text"
                    value={form.provider}
                    onChange={(event) => handleChange('provider', event.target.value)}
                    placeholder="Ex: M-Pesa, e-Mola"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Referência inicial
                  </label>
                  <input
                    type="text"
                    value={form.referencePrefix}
                    onChange={(event) =>
                      handleChange(
                        'referencePrefix',
                        event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
                      )
                    }
                    maxLength={8}
                    placeholder="Ex: PAY"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm uppercase text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Até 8 letras ou números. Início da referência única (20 caracteres) por transação.
                  </p>
                </div>
              </div>

              {/* Preview da referência */}
              {form.referencePrefix && (
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Exemplo de referência
                  </p>
                  <p className="mt-0.5 break-all font-mono text-xs text-slate-700 dark:text-slate-300">
                    {form.referencePrefix}
                    {'ABCDEFGHIJKLMN'.slice(0, Math.max(0, 20 - form.referencePrefix.length))}
                  </p>
                </div>
              )}
            </section>

            {/* Secção: Configuração */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Configuração
              </h3>
              <label className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={form.isExternal}
                  onChange={(event) => handleChange('isExternal', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Carteira externa (integrada a um gateway de pagamento)
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
                {saving ? 'Guardando...' : form.id ? 'Guardar alterações' : 'Criar tipo'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Detalhe do tipo selecionado */}
      {!showForm && selectedType && (
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Tipo selecionado</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {selectedType.name} · {selectedType.code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ← Voltar à lista
            </button>
          </div>

          <div className="max-w-xl">
            <TypeDetailsCard type={selectedType} onClose={() => setSelectedType(null)} />
          </div>
        </div>
      )}

      {/* Lista */}
      {!showForm && !selectedType && (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Tipos existentes
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Clique num tipo para ver os detalhes.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {types.length}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              A carregar tipos de carteira...
            </div>
          ) : types.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              Nenhum tipo de carteira encontrado.
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
                      <th className="px-4 py-3">Provedor</th>
                      <th className="px-4 py-3">Referência</th>
                      <th className="px-4 py-3">Externa</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                    {types.map((type) => (
                      <tr
                        key={type.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedType(type)}
                        onKeyDown={(event) => handleRowKeyDown(event, type)}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900 dark:text-white">
                          {type.code}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {type.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {type.provider || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {type.referencePrefix || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {type.isExternal ? 'Sim' : 'Não'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              type.status
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {type.status ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(event) => handleEdit(event, type)}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(event) => toggleTypeStatus(event, type)}
                              disabled={statusLoading === type.id}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                type.status
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {statusLoading === type.id
                                ? 'A processar...'
                                : type.status
                                  ? 'Desativar'
                                  : 'Ativar'}
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
                {types.map((type) => (
                  <div
                    key={type.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedType(type)}
                    onKeyDown={(event) => handleRowKeyDown(event, type)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {type.name}
                        </p>
                        <p className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                          {type.code}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          type.status
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {type.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Provedor</span>
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {type.provider || 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Referência</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {type.referencePrefix || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider">Externa</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {type.isExternal ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedType(type);
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        Detalhes
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleEdit(event, type)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(event) => toggleTypeStatus(event, type)}
                        disabled={statusLoading === type.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          type.status
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {statusLoading === type.id
                          ? 'A processar...'
                          : type.status
                            ? 'Desativar'
                            : 'Ativar'}
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

export default AdminWalletTypes;