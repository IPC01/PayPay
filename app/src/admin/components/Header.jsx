// Header.jsx - Versão leve com fundo branco e cores pretas
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useUi } from '../../contexts/UiContext';

const PAGE_TITLES = [
  { path: '/admin/legal-pages', label: 'Páginas Legais' },
  { path: '/admin/users', label: 'Utilizadores' },
  { path: '/admin/wallets', label: 'Carteiras' },
  { path: '/admin/transactions', label: 'Transações' },
  { path: '/admin/tickets', label: 'Tickets' },
  { path: '/admin/withdrawals', label: 'Saques' },
  { path: '/admin/kyc', label: 'KYC' },
  { path: '/admin/packages', label: 'Pacotes' },
  { path: '/admin/subscriptions', label: 'Subscrições' },
  { path: '/admin/settings', label: 'Configurações' },
  { path: '/admin/profile', label: 'Meu Perfil' },
  { path: '/admin/notifications', label: 'Notificações' },
  { path: '/admin', label: 'Dashboard' }
];

function getPageTitle(pathname) {
  const match = PAGE_TITLES.find(
    (page) => pathname === page.path || pathname.startsWith(`${page.path}/`)
  );
  return match?.label || 'Área Administrativa';
}

function Header({ onToggleMobileSidebar }) {
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

  const pageTitle = getPageTitle(location.pathname);

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
      navigate('/admin/notifications');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'A';
    return user.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-none items-center gap-3 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-500 transition-all duration-200 hover:border-gray-600 hover:bg-gray-50 hover:text-gray-800 md:hidden"
          aria-label="Abrir menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="min-w-0 truncate text-base font-semibold text-gray-900">{pageTitle}</h1>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
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
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-500 transition-all duration-200 hover:border-gray-600 hover:bg-gray-50 hover:text-gray-800"
              aria-label="Notificações"
              title="Notificações"
            >
              {unreadNotifications.length > 0 && (
                <span className="absolute right-0 top-0 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                  {unreadNotifications.length}
                </span>
              )}
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
              </svg>
            </button>

            {notificationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Notificações do sistema</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationDropdownOpen(false);
                      navigate('/admin/notifications');
                    }}
                    className="text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {notificationsLoading ? (
                    <p className="px-2 py-3 text-sm text-gray-500">Carregando notificações do sistema...</p>
                  ) : unreadNotifications.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-gray-500">Sem novas notificações do sistema.</p>
                  ) : (
                    unreadNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full rounded-lg px-3 py-2 text-left transition-all duration-200 hover:bg-gray-50"
                      >
                        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                        <p className="mt-1 text-xs text-gray-600">{notification.message}</p>
                        <p className="mt-1 text-[11px] text-gray-400">{new Date(notification.createdAt).toLocaleString('pt-PT')}</p>
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
              className="flex items-center gap-2 rounded-xl p-1.5 transition-all duration-200 hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-md">
                {getUserInitials()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-gray-900">{user?.name?.split(' ')[0] || 'Administrador'}</span>
                <span className="block text-xs text-gray-500">{user?.email}</span>
              </span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="p-2">
                  <NavLink
                    to="/admin/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
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
                    className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
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
                    className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      <span>Idioma</span>
                    </span>
                    <span className="text-xs font-medium text-gray-400">{language.toUpperCase()}</span>
                  </button>
                  <div className="my-2 border-t border-gray-200" />
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-all duration-200 hover:bg-red-50"
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