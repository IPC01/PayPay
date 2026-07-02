import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function NotificationsPage() {
  const navigate = useNavigate();
  const { authRequest, user } = useAuth();
  const { notify } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/notifications');
      setNotifications(data);

      if (data.length > 0) {
        notify({
          type: 'info',
          title: 'Notificações',
          message: `Você tem ${data.length} notificações.`,
          duration: 4000
        });
      }

      const unreadItems = data.filter((notification) => !notification.read);
      if (unreadItems.length > 0) {
        await Promise.allSettled(
          unreadItems.map((notification) =>
            authRequest(`/api/notifications/${notification.id}/read`, {
              method: 'PATCH'
            })
          )
        );

        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao carregar notificações',
        message: err.message || 'Não foi possível carregar as notificações.'
      });
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (notificationId) => {
    try {
      await authRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      setNotifications((prev) => prev.map((notification) => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      }));
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
    const text = `${notification.title} ${notification.message}`.toLowerCase();

    if (text.includes('kyc')) {
      return '/client/kyc';
    }
    if (text.includes('ticket')) {
      return user?.roleId === 1 ? '/admin/tickets' : '/client/tickets';
    }
    if (text.includes('saque') || text.includes('withdrawal') || text.includes('retirada')) {
      return user?.roleId === 1 ? '/admin/withdrawals' : '/client/withdrawals';
    }
    return user?.roleId === 1 ? '/admin' : '/client';
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markRead(notification.id);
    }
    navigate(getNotificationPath(notification));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Notificações</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Suas notificações</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja os avisos de saque, aprovações e atualizações do sistema.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {loading ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar notificações...</div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-6 py-5 transition ${notification.read ? 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(notification.createdAt).toLocaleString('pt-PT')}</span>
                    {!notification.read && (
                      <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Novo</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
