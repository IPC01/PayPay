import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUi } from '../contexts/UiContext';
import Sidebar from './Sidebar';
import Footer from '../public/components/Footer';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, authRequest } = useAuth();
  const { settings } = useSettings();
  const { theme, language, toggleTheme, toggleLanguage } = useUi();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadUnreadNotifications = async () => {
      if (!user) {
        setUnreadNotifications(0);
        return;
      }

      try {
        if (location.pathname === '/notifications') {
          setUnreadNotifications(0);
          return;
        }

        const notifications = await authRequest('/api/notifications');
        setUnreadNotifications(notifications.filter((notification) => !notification.read).length);
      } catch (error) {
        console.error('Failed to load notifications count:', error);
      }
    };

    loadUnreadNotifications();
  }, [authRequest, location.pathname, user]);

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              {user && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm transition hover:border-brand-300 hover:text-brand-700 md:hidden"
                >
                  <span className="sr-only">Abrir menu</span>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
                    {settings?.platformName ? 'Plataforma' : 'Painel'}
                  </p>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {settings?.platformName || 'SAMPAY'}
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Notificações"
              >
                {unreadNotifications > 0 && (
                  <span className="absolute right-0 top-0 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-semibold text-white">
                    {unreadNotifications}
                  </span>
                )}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
                </svg>
              </button>
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
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">
                      {user?.name?.split(' ')[0] || 'Usuário'}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </span>
                  </span>
                  <svg className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-b border-slate-200 dark:border-slate-700 p-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <NavLink
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
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
                        className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          {theme === 'light' ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          )}
                          <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                        </div>
                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleLanguage();
                          setDropdownOpen(false);
                        }}
                        className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          <span>Idioma</span>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs font-medium ${language === 'pt' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>PT</span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className={`text-xs font-medium ${language === 'en' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>EN</span>
                        </div>
                      </button>
                      <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950"
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

        {unreadNotifications > 0 && location.pathname !== '/notifications' && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
            Você tem <span className="font-semibold">{unreadNotifications}</span> notificações não lidas. Clique no sino para acompanhar.
          </div>
        )}

        <main className="flex-1 overflow-y-auto md:pl-80">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white dark:bg-slate-800/50 shadow-sm p-6">
              {children}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default Layout;
