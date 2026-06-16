import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function Profile() {
  const { user, authRequest } = useAuth();
  const { notify } = useNotification();
  const [kycStatus, setKycStatus] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notify({
        type: 'error',
        title: 'Erro na confirmação',
        message: 'A nova senha e a confirmação não coincidem.'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      notify({
        type: 'error',
        title: 'Senha muito curta',
        message: 'A nova senha deve ter pelo menos 6 caracteres.'
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      await authRequest('/api/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      });
      
      notify({
        type: 'success',
        title: 'Senha atualizada',
        message: 'Sua senha foi atualizada com sucesso!'
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao atualizar senha',
        message: err.message || 'Não foi possível atualizar sua senha.'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    const loadKyc = async () => {
      try {
        const response = await authRequest('/api/kyc');
        setKycStatus(response?.kyc?.status || 'DRAFT');
      } catch (err) {
        console.error(err);
      }
    };

    loadKyc();
  }, [authRequest]);

  const handleDeleteAccount = async () => {
    if (window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.')) {
      const confirmEmail = prompt('Digite seu email para confirmar a exclusão da conta:');
      
      if (confirmEmail === user?.email) {
        try {
          await authRequest('/api/auth/delete-account', {
            method: 'DELETE'
          });
          
          notify({
            type: 'success',
            title: 'Conta excluída',
            message: 'Sua conta foi excluída com sucesso.'
          });
          
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } catch (err) {
          notify({
            type: 'error',
            title: 'Erro ao excluir conta',
            message: err.message || 'Não foi possível excluir sua conta.'
          });
        }
      } else if (confirmEmail) {
        notify({
          type: 'error',
          title: 'Email incorreto',
          message: 'O email informado não corresponde ao da sua conta.'
        });
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil do Utilizador</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gerencie suas informações pessoais e configurações de segurança
          </p>
        </div>
        <div className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          {user?.role === 'admin' ? 'Administrador' : 'Utilizador'}
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${kycStatus === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
          {kycStatus === 'APPROVED' ? 'KYC aprovado' : kycStatus ? `KYC ${kycStatus.toLowerCase()}` : 'KYC pendente'}
        </div>
      </div>

      {/* Seção: Dados Pessoais - Em Flex */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg">
            <span className="text-xl font-bold">{getUserInitials()}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Dados Pessoais</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Suas informações de cadastro</p>
          </div>
        </div>

        {/* Layout Flex para os cards */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <div className="flex-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Nome completo</p>
            <p className="mt-1 text-base font-medium text-slate-900 dark:text-white">{user?.name || 'Utilizador'}</p>
          </div>

          <div className="flex-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Endereço de email</p>
            <p className="mt-1 text-base font-medium text-slate-900 dark:text-white">{user?.email}</p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Email verificado</p>
          </div>

          <div className="flex-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Membro desde</p>
            <p className="mt-1 text-base font-medium text-slate-900 dark:text-white">{formatDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Seção: Alterar Senha */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Alterar Senha</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Mantenha sua conta segura atualizando sua senha regularmente</p>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Senha atual
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Digite sua senha atual"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nova senha
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Digite sua nova senha"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
            <p className="mt-1 text-xs text-slate-500">A senha deve ter pelo menos 6 caracteres</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirme sua nova senha"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isChangingPassword ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Atualizando...
              </>
            ) : (
              'Atualizar senha'
            )}
          </button>
        </form>
      </div>

      {/* Seção: Ações da Conta */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ações da Conta</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ações irreversíveis que afetam sua conta</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Excluir Conta</p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir minha conta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Sessão Atual */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sessão Atual</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Informações da sua sessão atual</p>
        </div>

        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
          <div className="rounded-full bg-brand-100 p-2 dark:bg-brand-900/30">
            <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Sessão atual</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Navegador • {new Date().toLocaleString('pt-PT')}</p>
          </div>
          <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Ativa
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;