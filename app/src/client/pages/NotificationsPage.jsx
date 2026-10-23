import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { isAdmin, isStaff, managementPath } from '../../helpers/roles';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

function formatRelative(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Há ${days} d`;
  return d.toLocaleDateString('pt-PT');
}

function formatAbsolute(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-PT');
}

function getNotificationCategory(notification) {
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (text.includes('kyc')) return 'kyc';
  if (text.includes('ticket')) return 'ticket';
  if (text.includes('saque') || text.includes('withdrawal') || text.includes('retirada')) {
    return 'withdrawal';
  }
  return 'system';
}

const CATEGORY_META = {
  kyc: {
    label: 'KYC',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200'
  },
  ticket: {
    label: 'Suporte',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
  },
  withdrawal: {
    label: 'Saque',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
  },
  system: {
    label: 'Sistema',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
  }
};

function NotificationsPage() {
  const navigate = useNavigate();
  const { authRequest, user } = useAuth();
  const { notify } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await authRequest('/api/notifications');
      setNotifications(data);

      // Marcar como lidas apenas no carregamento inicial (não na sincronização)
      if (!silent) {
        const unreadItems = data.filter((n) => !n.read);
        if (unreadItems.length > 0) {
          await Promise.allSettled(
            unreadItems.map((n) =>
              authRequest(`/api/notifications/${n.id}/read`, { method: 'PATCH' })
            )
          );
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        notify({
          type: 'error',
          title: 'Erro ao carregar notificações',
          message: err.message || 'Não foi possível carregar as notificações.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página.
  // O filtro ativo (todas/não lidas) é aplicado no cliente e preserva-se.
  useAutoRefresh(() => loadNotifications(true));

  const markRead = async (notificationId) => {
    try {
      await authRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao marcar como lida',
        message: err.message || 'Não foi possível atualizar a notificação.'
      });
    }
  };

  const getNotificationPath = (notification) => {
    const category = getNotificationCategory(notification);
    if (category === 'kyc') {
      return isStaff(user) ? managementPath(user, '/admin/kyc') : '/client/kyc';
    }
    if (category === 'ticket') {
      return isStaff(user) ? managementPath(user, '/admin/tickets') : '/client/tickets';
    }
    if (category === 'withdrawal') {
      return isAdmin(user)
        ? '/admin/withdrawals'
        : isStaff(user)
          ? managementPath(user, '/admin/wallets')
          : '/client/withdrawals';
    }
    return '/';
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) await markRead(notification.id);
    navigate(getNotificationPath(notification));
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const visibleNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
            Notificações
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Suas notificações
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja os avisos de saque, aprovações e atualizações do sistema.
          </p>
        </div>
        {!loading && notifications.length > 0 && (
          <span className="inline-flex self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}`
              : 'Tudo em dia'}
          </span>
        )}
      </div>

      {/* Filtro */}
      {!loading && notifications.length > 0 && (
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'unread', label: `Não lidas${unreadCount > 0 ? ` (${unreadCount})` : ''}` }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg
                className="mx-auto h-10 w-10 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                Ainda não tem notificações
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Novas atualizações aparecerão aqui automaticamente.
              </p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhuma notificação não lida.
            </div>
          ) : (
            visibleNotifications.map((notification) => {
              const category = getNotificationCategory(notification);
              const meta = CATEGORY_META[category];
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 sm:px-6 ${
                    notification.read
                      ? 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/60'
                      : 'bg-brand-50/60 hover:bg-brand-50 dark:bg-brand-900/20 dark:hover:bg-brand-900/30'
                  }`}
                >
                  {/* Categoria */}
                  <span
                    className={`mt-0.5 shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.className}`}
                  >
                    {meta.label}
                  </span>

                  {/* Conteúdo */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          notification.read
                            ? 'font-medium text-slate-700 dark:text-slate-300'
                            : 'font-bold text-slate-900 dark:text-white'
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          NOVO
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                      {notification.message}
                    </p>
                    <p
                      className="mt-1 text-[10px] text-slate-500 dark:text-slate-500"
                      title={formatAbsolute(notification.createdAt)}
                    >
                      {formatRelative(notification.createdAt)}
                    </p>
                  </div>

                  {/* Seta */}
                  <svg
                    className="mt-1 h-4 w-4 shrink-0 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;