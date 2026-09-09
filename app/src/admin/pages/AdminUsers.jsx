import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN'
  });
}

const EMPTY_FORM = { name: '', email: '', password: '', roleName: 'user' };

function AdminUsers() {
  const { authRequest, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users
      .filter((user) => {
        const fields = [
          user.name || '',
          user.email || '',
          user.Role?.name || '',
          user.isActive ? 'ativo' : 'bloqueado'
        ];
        return !query || fields.join(' ').toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const left = String(a[sortBy] ?? '').toLowerCase();
        const right = String(b[sortBy] ?? '').toLowerCase();

        if (left < right) return sortOrder === 'asc' ? -1 : 1;
        if (left > right) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [users, search, sortBy, sortOrder]);

  const setSortField = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder('asc');
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setCreateForm(EMPTY_FORM);
    setCreateError('');
    setShowCreateForm(true);
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setCreateError('');
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    try {
      setCreateLoading(true);
      setCreateError('');
      await authRequest('/api/users', {
        method: 'POST',
        body: createForm
      });
      setFeedback(`Utilizador ${createForm.name} foi criado com sucesso.`);
      setShowCreateForm(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      setCreateError(err.message || 'Não foi possível criar o utilizador.');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleUserStatus = async (user) => {
    if (user.id === currentUser?.id && user.isActive) {
      setFeedback('Não é possível bloquear a sua própria conta.');
      return;
    }

    const nextStatus = !user.isActive;

    try {
      setActionLoading(user.id);
      const response = await authRequest(`/api/users/${user.id}`, {
        method: 'PUT',
        body: { isActive: nextStatus }
      });

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, isActive: response.user.isActive } : item))
      );
      setFeedback(`Usuário ${response.user.name} foi ${response.user.isActive ? 'ativado' : 'bloqueado'} com sucesso.`);
    } catch (err) {
      console.error(err);
      setFeedback('Não foi possível atualizar o estado do utilizador.');
    } finally {
      setActionLoading(null);
    }
  };

  const openUserDetails = async (user) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      const [userData, walletData, transactionData] = await Promise.all([
        authRequest(`/api/users/${user.id}`),
        authRequest(`/api/admin/users/${user.id}/wallets`),
        authRequest(`/api/admin/users/${user.id}/transactions`)
      ]);

      setSelectedUserDetail({
        user: userData,
        wallets: walletData,
        transactions: transactionData
      });
    } catch (err) {
      console.error(err);
      setFeedback('Não foi possível carregar os detalhes do utilizador.');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetails = () => {
    setShowDetail(false);
    setSelectedUserDetail(null);
  };

  // Renderiza o formulário de criação inline
  const renderCreateForm = () => (
    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Adicionar Utilizador</h2>
          <p className="mt-1 text-sm text-gray-500">Preencha os dados para criar um novo utilizador</p>
        </div>
        <button
          type="button"
          onClick={closeCreateForm}
          className="rounded-full border border-gray-300 p-2 text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
        >
          <span className="sr-only">Fechar</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleCreateUser} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Nome</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-gray-700 focus:ring-2 focus:ring-gray-700/20"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Email</label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-gray-700 focus:ring-2 focus:ring-gray-700/20"
              placeholder="email@exemplo.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-gray-700 focus:ring-2 focus:ring-gray-700/20"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Perfil</label>
            <select
              value={createForm.roleName}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, roleName: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-gray-700 focus:ring-2 focus:ring-gray-700/20"
            >
              <option value="user">Utilizador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        {createError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{createError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={closeCreateForm}
            className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createLoading}
            className="rounded-xl bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-gray-800/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-lg hover:shadow-gray-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createLoading ? 'A criar...' : 'Criar Utilizador'}
          </button>
        </div>
      </form>
    </div>
  );

  // Renderiza os detalhes do usuário inline
  const renderUserDetails = () => (
    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gray-500">Detalhes</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {selectedUserDetail?.user?.name || 'Utilizador'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{selectedUserDetail?.user?.email}</p>
        </div>
        <button
          type="button"
          onClick={closeUserDetails}
          className="rounded-full border border-gray-300 p-2 text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
        >
          <span className="sr-only">Fechar</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {detailLoading ? (
        <div className="py-10 text-center text-gray-500">A carregar detalhes do utilizador...</div>
      ) : selectedUserDetail ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Perfil</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{selectedUserDetail.user?.Role?.name || 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Carteiras</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{selectedUserDetail.wallets.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Transações</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{selectedUserDetail.transactions.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-700">Carteiras</h3>
            {selectedUserDetail.wallets.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Sem carteiras para este utilizador.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {selectedUserDetail.wallets.slice(0, 6).map((wallet) => (
                  <div key={wallet.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">{wallet.code || wallet.walletCode || 'Carteira'}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(wallet.balance)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-700">Últimas transações</h3>
            {selectedUserDetail.transactions.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Sem transações registadas.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {selectedUserDetail.transactions.slice(0, 8).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    <span className="text-gray-600">{transaction.reference || transaction.walletCode || `TX-${transaction.id}`}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Utilizadores</h1>
          <p className="mt-2 text-sm text-gray-500">
            Liste e analise todos os utilizadores registados no sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-gray-800/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-lg hover:shadow-gray-800/30"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Utilizador
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      )}

      {showCreateForm && renderCreateForm()}

      {showDetail && renderUserDetails()}

      {!showCreateForm && !showDetail && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome, email, perfil ou estado"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-gray-700 focus:ring-2 focus:ring-gray-700/20 focus:bg-white"
            />
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span>Ordenar:</span>
              <button
                type="button"
                onClick={() => setSortField('name')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  sortBy === 'name' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Nome
              </button>
              <button
                type="button"
                onClick={() => setSortField('email')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  sortBy === 'email' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setSortField('createdAt')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  sortBy === 'createdAt' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Data
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-[0.2em] text-gray-500">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Perfil</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Criado em</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">A carregar utilizadores...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Nenhum utilizador encontrado.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-gray-600">{user.Role?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString('pt-PT')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openUserDetails(user)}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-all duration-200 hover:border-gray-600 hover:bg-gray-50"
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(user)}
                            disabled={actionLoading === user.id || (user.id === currentUser?.id && user.isActive)}
                            title={user.id === currentUser?.id && user.isActive ? 'Não é possível bloquear a sua própria conta' : undefined}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                              user.isActive 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {actionLoading === user.id ? 'A processar...' : user.isActive ? 'Bloquear' : 'Ativar'}
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
      )}
    </div>
  );
}

export default AdminUsers;