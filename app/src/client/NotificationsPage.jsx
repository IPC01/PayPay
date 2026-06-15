import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function NotificationsPage() {
  const { authRequest } = useAuth();
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
          ) : notifications.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhuma notificação nova.</div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className={`px-6 py-5 ${notification.read ? 'bg-slate-50 dark:bg-slate-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(notification.createdAt).toLocaleString('pt-PT')}</span>
                    {!notification.read && (
                      <button
                        onClick={() => markRead(notification.id)}
                        className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-700"
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
