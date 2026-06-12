import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timeouts = useRef({});

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    if (timeouts.current[id]) {
      window.clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  }, []);

  const notify = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications((prev) => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  useEffect(() => {
    notifications.forEach((notification) => {
      if (!timeouts.current[notification.id]) {
        timeouts.current[notification.id] = window.setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
    });

    return () => {
      Object.values(timeouts.current).forEach(window.clearTimeout);
    };
  }, [notifications, removeNotification]);

  const value = useMemo(
    () => ({ notifications, notify, removeNotification }),
    [notifications, notify, removeNotification]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  return useContext(NotificationContext);
}
