import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTokenModalOpen, setNewTokenModalOpen] = useState(false);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null);
  const [newToken, setNewToken] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    scopes: [],
    expiresIn: '30'
  });
  const [availableScopes, setAvailableScopes] = useState([]);
  const [kyc, setKyc] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const { user, authRequest } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    async function init() {
      const currentKyc = await loadKyc();
      if (currentKyc?.status === 'APPROVED') {
        await Promise.all([fetchApiKeys(), fetchAvailableScopes()]);
      } else {
        setLoading(false);
      }
    }

    init();
  }, []);

  const loadKyc = async () => {
    try {
      setKycLoading(true);
      const response = await authRequest('/api/kyc');
      const currentKyc = response?.kyc || null;
      setKyc(currentKyc);
      return currentKyc;
    } catch (error) {
      console.error('Erro ao carregar KYC:', error);
      setKyc(null);
      return null;
    } finally {
      setKycLoading(false);
    }
  };

  const fetchAvailableScopes = async () => {
    try {
      const response = await api.get('/api/permissions');
      setAvailableScopes(
        (response.permissions || []).map((permission) => ({
          name: permission.name,
          label: permission.description || permission.name
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      notify({
        type: 'error',
        title: 'Falha ao carregar permissões',
        message: 'Não foi possível carregar as permissões do servidor.'
      });
    }
  };

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/keys');
      setApiKeys(response.apiKeys || []);
    } catch (error) {
      console.error('Erro ao carregar API Keys:', error);
      notify({
        type: 'error',
        title: 'Falha ao listar chaves de acesso',
        message: 'Não foi possível carregar as chaves de acesso.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const expiresAt = formData.expiresIn === 'never' 
        ? null 
        : new Date(Date.now() + parseInt(formData.expiresIn) * 24 * 60 * 60 * 1000);
      
      const response = await api.post('/api/keys', {
        name: formData.name,
        scopes: formData.scopes,
        expiresAt
      });
      
      setNewToken(response.token || response.bearerToken);
      setModalOpen(false);
      setNewTokenModalOpen(true);
      fetchApiKeys();
      setFormData({ name: '', scopes: [], expiresIn: '30' });
    } catch (error) {
      console.error('Erro ao criar API Key:', error);
      notify({
        type: 'error',
        title: 'Falha ao criar chave de acesso',
        message: 'Verifique os dados e tente novamente.'
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/api/keys/${id}`, { isActive: !currentStatus });
      fetchApiKeys();
      notify({
        type: 'success',
        title: 'Status atualizado',
        message: currentStatus ? 'Chave de acesso desativada com sucesso.' : 'Chave de acesso ativada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      notify({
        type: 'error',
        title: 'Falha ao atualizar status',
        message: 'Não foi possível alterar o status da chave de acesso.'
      });
    }
  };

  const handleRenew = async (id) => {
    try {
      await api.patch(`/api/keys/${id}`, { action: 'renew' });
      fetchApiKeys();
    } catch (error) {
      console.error('Erro ao renovar API Key:', error);
      notify({
        type: 'error',
        title: 'Falha ao renovar chave de acesso',
        message: 'Tente novamente em alguns instantes.'
      });
    }
  };

  const handleDelete = async (id, name) => {
    setConfirmDeleteKey({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteKey) return;

    try {
      await api.delete(`/api/keys/${confirmDeleteKey.id}`);
      fetchApiKeys();
      notify({
        type: 'success',
        title: 'Chave de acesso excluída',
        message: 'A chave de acesso foi removida com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir API Key:', error);
      notify({
        type: 'error',
        title: 'Falha ao excluir chave de acesso',
        message: 'Não foi possível excluir a chave de acesso.'
      });
    } finally {
      setConfirmDeleteKey(null);
    }
  };

  const copyToClipboard = (token) => {
    navigator.clipboard.writeText(token);
    notify({
      type: 'success',
      title: 'Copiado',
      message: 'Token copiado para a área de transferência.'
    });
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca expira';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive, expiresAt) => {
    if (!isActive) {
      return <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">Inativa</span>;
    }
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Expirada</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativa</span>;
  };

  if (kycLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center text-slate-600 dark:text-slate-300">Carregando dados do KYC...</div>
      </div>
    );
  }

  if (kyc?.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm dark:border-red-700/40 dark:bg-red-950/20">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-red-600">Atenção</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">KYC necessário</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Você precisa completar o KYC e ser aprovado antes de criar ou gerenciar chaves de acesso.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/client/kyc"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Ir para KYC
            </Link>
            <span className="text-sm text-slate-600 dark:text-slate-400">Após aprovação, você terá acesso à criação de chaves.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Chaves de Acesso</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gerencie suas chaves de acesso para conexões externas ao sistema
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 dark:shadow-brand-950"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Gerar nova chave de acesso
        </button>
      </div>

      {/* Tabela de API Keys */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Nome
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Último uso
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expira em
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Criada em
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Nenhuma chave de acesso criada ainda
                    </p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Criar primeira chave de acesso
                    </button>
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {key.name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(key.isActive, key.expiresAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Nunca usado'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(key.expiresAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(key.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(key.id, key.isActive)}
                          className={`rounded-lg p-2 transition ${
                            key.isActive
                              ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-950'
                              : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950'
                          }`}
                          title={key.isActive ? 'Desativar' : 'Ativar'}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {key.isActive ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 5.636a9 9 0 0112.728 12.728M5.636 5.636a9 9 0 0112.728 12.728" />
                            )}
                          </svg>
                        </button>
                        
                        {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                          <button
                            onClick={() => handleRenew(key.id)}
                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                            title="Renovar"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(key.id, key.name)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                          title="Excluir"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-800">
            <div className="border-b border-slate-200 p-6 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Criar nova chave de acesso
              </h3>
            </div>
            
            <form onSubmit={handleCreateKey}>
              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome da chave *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    placeholder="Ex: API Produção, API Teste"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Permissões
                  </label>
                  <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    {availableScopes.map((scope) => (
                      <label key={scope.name} className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          value={scope.name}
                          checked={formData.scopes.includes(scope.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                scopes: [...formData.scopes, scope.name]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                scopes: formData.scopes.filter(s => s !== scope.name)
                              });
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {scope.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Expiração
                  </label>
                  <select
                    value={formData.expiresIn}
                    onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="7">7 dias</option>
                    <option value="30">30 dias</option>
                    <option value="90">90 dias</option>
                    <option value="365">1 ano</option>
                    <option value="never">Nunca expira</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 p-6 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Gerar chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDeleteKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-800">
            <div className="border-b border-slate-200 p-6 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Confirmar exclusão</h3>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Tem certeza que deseja excluir a API Key <strong>{confirmDeleteKey.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteKey(null)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Confirmar exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Token Gerado com Alerta */}
      {newTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl transform rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-800">
            <div className="border-b border-slate-200 p-6 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    ⚠️ Chave de acesso gerada com sucesso!
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Esta é a única vez que o token será exibido
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/30">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-800 dark:text-red-300">
                    <p className="font-semibold">Importante!</p>
                    <p className="mt-1">
                      Este token não será exibido novamente. Certifique-se de copiá-lo e armazená-lo em um local seguro.
                      Se você perder este token, precisará gerar uma nova chave.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-900">
                <label className="mb-2 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Seu token de acesso
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all font-mono text-sm text-slate-700 dark:text-slate-300">
                    {newToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newToken)}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-brand-600 shadow-sm transition hover:bg-brand-50 dark:bg-slate-800 dark:text-brand-400 dark:hover:bg-slate-700"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold">Como usar:</p>
                    <p className="mt-1">
                      Inclua este token no header das suas requisições: <br />
                      <code className="mt-1 block rounded bg-white px-2 py-1 font-mono text-xs dark:bg-slate-800">
                        Authorization: Bearer seu token de acesso
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 p-6 dark:border-slate-700">
              <button
                onClick={() => {
                  setNewTokenModalOpen(false);
                  setNewToken(null);
                }}
                className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Entendi, vou guardar o token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiKeys;