import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useSettings } from '../../contexts/SettingsContext';
import { isStaff, managementPath, roleLabel } from '../../helpers/roles';

const KYC_STYLES = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
};

const KYC_LABELS = {
  APPROVED: 'KYC aprovado',
  PENDING: 'KYC em análise',
  REJECTED: 'KYC rejeitado',
  DRAFT: 'KYC pendente'
};

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 2) return { level: 1, label: 'Fraca', color: 'bg-rose-500' };
  if (score <= 3) return { level: 2, label: 'Razoável', color: 'bg-amber-500' };
  if (score <= 4) return { level: 3, label: 'Forte', color: 'bg-emerald-500' };
  return { level: 4, label: 'Muito forte', color: 'bg-emerald-600' };
}

function Profile() {
  const { user, authRequest, logout } = useAuth();
  const { notify } = useNotification();
  const { confirm } = useConfirmation();
  const { settings: appSettings } = useSettings();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [kycResponse, settingsResponse] = await Promise.all([
          authRequest('/api/kyc'),
          authRequest('/api/settings')
        ]);
        setKycStatus(kycResponse?.kyc?.status || 'DRAFT');
        setCompanyInfo({
          ...settingsResponse,
          logoImg: assetUrl(settingsResponse?.logoImg)
        });
      } catch (err) {
        console.error(err);
      }
    };
    loadDashboardData();
  }, [authRequest]);

  const passwordMismatch =
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword !== passwordData.confirmPassword;
  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordData.newPassword),
    [passwordData.newPassword]
  );
  const canSubmitPassword =
    !isChangingPassword &&
    passwordData.currentPassword &&
    passwordData.newPassword.length >= 6 &&
    passwordData.newPassword === passwordData.confirmPassword;

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordMismatch) {
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
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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

  const handleDeleteAccount = async () => {
    if (!(await confirm({
      title: 'Excluir conta',
      message: 'Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.',
      confirmLabel: 'Excluir minha conta',
      input: {
        label: 'Digite seu email para confirmar a exclusão da conta:',
        type: 'email',
        expectedValue: user?.email,
        errorMessage: 'O email informado não corresponde ao da sua conta.'
      }
    }))) return;

    try {
      await authRequest('/api/auth/delete-account', { method: 'DELETE' });
      notify({
        type: 'success',
        title: 'Conta excluída',
        message: 'Sua conta foi excluída com sucesso.'
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao excluir conta',
        message: err.message || 'Não foi possível excluir sua conta.'
      });
    }
  };

  // ── Componente auxiliar ──────────────────────────────────────────────────
  const InfoTile = ({ label, children, span = false }) => (
    <div
      className={`rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900 ${
        span ? 'sm:col-span-2' : ''
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm text-slate-900 dark:text-white">{children}</div>
    </div>
  );

  const PasswordInput = ({ label, value, onChange, placeholder }) => (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </label>
      <input
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
            Conta
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Perfil do Utilizador
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Gerencie as suas informações pessoais e configurações de segurança.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() =>
              navigate(
                isStaff(user)
                  ? managementPath(user, '/admin/notifications')
                  : '/client/notifications'
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Abrir notificações"
            title="Notificações"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
            </svg>
          </button>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            {roleLabel(user)}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              KYC_STYLES[kycStatus] || KYC_STYLES.DRAFT
            }`}
          >
            {KYC_LABELS[kycStatus] || KYC_LABELS.DRAFT}
          </span>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Informações da Empresa */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Informações da Empresa
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Detalhes oficiais da plataforma
              </p>
            </div>
            {companyInfo?.logoImg && (
              <img
                src={companyInfo.logoImg}
                alt="Logo da empresa"
                className="h-10 w-10 rounded-xl object-contain"
              />
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <InfoTile label="Nome">
              <p className="font-medium">
                {companyInfo?.platformName || appSettings?.platformName || 'Não definido'}
              </p>
            </InfoTile>
            <InfoTile label="Proprietário">
              <p className="font-medium">{companyInfo?.ownerName || 'Não definido'}</p>
            </InfoTile>
            <InfoTile label="Contacto">
              <p>{companyInfo?.contacts || 'Nenhum contacto disponível.'}</p>
            </InfoTile>
            <InfoTile label="Endereço">
              <p>{companyInfo?.address || 'Nenhum endereço cadastrado.'}</p>
            </InfoTile>
            <InfoTile label="E-mails" span>
              <p>{companyInfo?.emails || 'Nenhum e-mail cadastrado.'}</p>
            </InfoTile>
            <InfoTile label="Mais informações" span>
              {companyInfo?.additionalInfo ? (
                <div className="space-y-1 text-xs leading-relaxed">
                  {companyInfo.additionalInfo.split(/\r?\n/).map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs">Não há informações adicionais publicadas.</p>
              )}
            </InfoTile>
          </div>
        </section>

        {/* Dados Pessoais */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
              <span className="text-base font-bold">{getInitials(user?.name)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                Dados Pessoais
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Suas informações de cadastro
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <InfoTile label="Nome completo">
              <p className="font-medium">{user?.name || 'Utilizador'}</p>
            </InfoTile>
            <InfoTile label="Endereço de email">
              <div className="flex flex-wrap items-center gap-2">
                <span className="break-all font-medium">{user?.email}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  ✓ Verificado
                </span>
              </div>
            </InfoTile>
            <InfoTile label="Membro desde">
              <p className="font-medium">{formatDate(user?.createdAt)}</p>
            </InfoTile>
          </div>
        </section>

        {/* Alterar Senha */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Alterar Senha
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Mantenha sua conta segura atualizando sua senha regularmente
            </p>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-3">
            <PasswordInput
              label="Senha atual"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              placeholder="Digite sua senha atual"
            />

            <div>
              <PasswordInput
                label="Nova senha"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                placeholder="Digite sua nova senha"
              />
              {passwordData.newPassword && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition ${
                          passwordStrength.level >= i
                            ? passwordStrength.color
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {passwordStrength.label} · mínimo 6 caracteres
                  </p>
                </div>
              )}
            </div>

            <div>
              <PasswordInput
                label="Confirmar nova senha"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="Confirme sua nova senha"
              />
              {passwordMismatch && (
                <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  As senhas não coincidem.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmitPassword}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isChangingPassword ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Atualizando...
                </>
              ) : (
                'Atualizar senha'
              )}
            </button>
          </form>
        </section>

        {/* Sessão Atual */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Sessão Atual
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Informações da sua sessão atual
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900/30">
              <svg
                className="h-4 w-4 text-brand-600 dark:text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Navegador
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {new Date().toLocaleString('pt-PT')}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Ativa
            </span>
          </div>
        </section>
      </div>

      {/* Zona de perigo */}
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm sm:p-6 dark:border-rose-900/40 dark:bg-rose-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                Excluir conta
              </p>
              <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-400">
                Ação irreversível. Todos os seus dados serão permanentemente removidos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Excluir minha conta
          </button>
        </div>
      </section>
    </div>
  );
}

export default Profile;