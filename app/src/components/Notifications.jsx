import { useNotification } from '../contexts/NotificationContext';

const styles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-sky-50 border-sky-200 text-sky-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  alert: 'bg-slate-50 border-slate-200 text-slate-900'
};

export default function Notifications() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed right-4 top-4 z-50 flex w-auto flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm rounded-3xl border p-4 shadow-xl ${styles[notification.type] || styles.info}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {notification.title && (
                <p className="text-sm font-semibold">{notification.title}</p>
              )}
              {notification.message && (
                <p className="text-sm leading-6">{notification.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="rounded-full p-1 text-sm font-bold text-current opacity-70 transition hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
