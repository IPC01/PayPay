import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useUi } from '../../contexts/UiContext';

function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const { user, logout, authRequest } = useAuth();
  const { settings } = useSettings();
  const { theme, language, toggleTheme, toggleLanguage } = useUi();
  const navigate = useNavigate();
  const location = useLocation();

  const getNotificationPath = useCallback((notification) => {
    const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();

    if (text.includes('kyc')) {
      return '/client/kyc';
    }
    if (text.includes('ticket')) {
      return '/client/tickets';
    }
    if (text.includes('saque') || text.includes('withdrawal') || text.includes('retirada')) {
      return '/client/withdrawals';
    }
    if (text.includes('carteira') || text.includes('wallet')) {
      return '/client/wallets';
    }

    return '/client';
  }, []);

  const loadUnreadNotifications = useCallback(async () => {
    if (!user) {
      setUnreadNotifications([]);
      return;
    }

    try {
      setNotificationsLoading(true);
      const notifications = await authRequest('/api/notifications');
      setUnreadNotifications(notifications.filter((notification) => !notification.read));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [authRequest, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadUnreadNotifications();
  }, [loadUnreadNotifications, location.pathname]);

  const handleNotificationClick = async (notification) => {
    try {
      await authRequest(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH'
      });
      setUnreadNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      setNotificationDropdownOpen(false);
      navigate(getNotificationPath(notification));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-none items-center justify-between px-3 py-2 sm:px-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Área do Cliente</p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{settings?.platformName || 'Gestão'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationDropdownRef}>
            <button
              type="button"
              onClick={() => {
                const nextState = !notificationDropdownOpen;
                setNotificationDropdownOpen(nextState);
                if (nextState) {
                  loadUnreadNotifications();
                }
              }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Notificações"
            >
              {unreadNotifications.length > 0 && (
                <span className="absolute right-0 top-0 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-semibold text-white">
                  {unreadNotifications.length}
                </span>
              )}
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
              </svg>
            </button>

            {notificationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Notificações do sistema</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationDropdownOpen(false);
                      navigate('/client/notifications');
                    }}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {notificationsLoading ? (
                    <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">Carregando notificações do sistema...</p>
                  ) : unreadNotifications.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">Sem novas notificações do sistema.</p>
                  ) : (
                    unreadNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{notification.message}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{new Date(notification.createdAt).toLocaleString('pt-PT')}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
                {getUserInitials()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-slate-900 dark:text-white">{user?.name?.split(' ')[0] || 'Usuário'}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{user?.email}</span>
              </span>
              <svg className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
                <div className="p-2">
                  <NavLink
                    to="/client/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Meu Perfil</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                      setDropdownOpen(false);
                    }}
                    className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleLanguage();
                      setDropdownOpen(false);
                    }}
                    className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      <span>Idioma</span>
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{language.toUpperCase()}</span>
                  </button>
                  <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;