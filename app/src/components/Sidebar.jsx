import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUi } from '../contexts/UiContext';
import { API_BASE } from '../services/api';

function Sidebar({ open, setOpen }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, language, toggleTheme, toggleLanguage } = useUi();
  const dropdownRef = useRef(null);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isTransactionsActive = location.pathname.startsWith('/transactions');

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obter iniciais do usuário
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [legalPages, setLegalPages] = useState([]);
  const { settings } = useSettings();
  const isAdmin = user?.roleId === 1;

  useEffect(() => {
    const loadLegalPages = async () => {
      if (isAdmin) return;
      try {
        const response = await fetch(`${API_BASE}/api/legal-pages`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) return;
        const data = await response.json();
        setLegalPages(data);
      } catch (error) {
        console.error('Unable to load legal pages', error);
      }
    };
    loadLegalPages();
  }, [isAdmin]);

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 transform overflow-y-auto border-r border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl transition-all duration-300 md:fixed md:h-screen md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-20' : 'w-80'}`}>
      <div className="flex h-full flex-col">
        {/* Header do Sidebar */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              {settings?.logoImg ? (
                <img
                  src={settings.logoImg}
                  alt={settings.platformName || 'Logo'}
                  className="h-10 w-10 rounded-2xl bg-white object-contain p-1"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 10h18M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {!collapsed && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">
                    {settings?.platformName || 'SAMPAY'}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {settings?.ownerName || 'Gestão Financeira'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 shadow-sm transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label={collapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {collapsed ? (
                    <path d="M9 6l6 6-6 6" />
                  ) : (
                    <path d="M15 6l-6 6 6 6" />
                  )}
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 md:hidden"
              >
                <span className="sr-only">Fechar menu</span>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 space-y-1 p-4">
          {!isAdmin && (
            <>
              <NavLink
                to="/"
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {!collapsed && 'Dashboard'}
              </NavLink>

              <NavLink
                to="/wallets"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {!collapsed && 'Carteiras'}
              </NavLink>

              <NavLink
                to="/withdrawals"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 6v6m0-6H9m3 0h3" />
                </svg>
                {!collapsed && 'Saques'}
              </NavLink>

              <NavLink
                to="/tokens"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {!collapsed && 'Chaves de Acesso'}
              </NavLink>

              <NavLink
                to="/tickets"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16v16H4z" />
                  <path d="M8 7h8M8 11h8M8 15h5" />
                </svg>
                {!collapsed && 'Tickets'}
              </NavLink>

              <NavLink
                to="/packages"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {!collapsed && 'Pacotes'}
              </NavLink>

              <NavLink
                to="/kyc"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c4.97 0 9 2.46 9 5.5 0 2.82-3.8 5.17-8.83 5.81a1.5 1.5 0 01-1.34-.5 1.5 1.5 0 01-1.34.5C6.8 13.67 3 11.32 3 8.5 3 5.46 7.03 3 12 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6m-3-3v6" />
                </svg>
                {!collapsed && 'KYC'}
              </NavLink>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setTransactionsOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isTransactionsActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18" />
                    </svg>
                    {!collapsed && 'Transações'}
                  </span>
                  {!collapsed && (
                    <svg className={`h-4 w-4 transition-transform ${transactionsOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </button>

                {!collapsed && transactionsOpen && (
                  <div className="mt-2 space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
                    <NavLink
                      to="/transactions"
                      onClick={() => {
                        setOpen(false);
                        setTransactionsOpen(false);
                      }}
                      className={({ isActive }) =>
                        `block rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      Lista de transações
                    </NavLink>
                    <NavLink
                      to="/transactions/c2b"
                      onClick={() => {
                        setOpen(false);
                        setTransactionsOpen(false);
                      }}
                      className={({ isActive }) =>
                        `block rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      Transações C2B
                    </NavLink>
                    <NavLink
                      to="/transactions/b2c"
                      onClick={() => {
                        setOpen(false);
                        setTransactionsOpen(false);
                      }}
                      className={({ isActive }) =>
                        `block rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      Transferência B2C
                    </NavLink>
                  </div>
                )}
              </div>

              <NavLink
                to="/notifications"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {!collapsed && 'Notificações'}
              </NavLink>

              <NavLink
                to="/company-info"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3C7.03 3 3 5.46 3 8.5c0 2.82 3.8 5.17 8.83 5.81a1.5 1.5 0 011.34.5 1.5 1.5 0 011.34-.5C20.2 13.67 24 11.32 24 8.5 24 5.46 19.97 3 15 3z" />
                  <path d="M12 12c-2.5 0-4.5 1.12-5.63 2.88L6 19h12l-.37-4.12C16.5 13.12 14.5 12 12 12z" />
                </svg>
                {!collapsed && 'Info Empresa'}
              </NavLink>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
                <NavLink
                  to="/legal"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    } ${collapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16v16H4z" />
                    <path d="M8 7h8M8 11h8M8 15h5" />
                  </svg>
                  {!collapsed && 'Documentos Legais'}
                </NavLink>
                {!collapsed && legalPages.length > 0 && (
                  <div className="mt-2 space-y-1 px-4">
                    {legalPages.map((page) => (
                      <NavLink
                        key={page.slug}
                        to={`/legal/${page.slug}`}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `block rounded-xl px-3 py-2 text-sm transition ${
                            isActive
                              ? 'bg-brand-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`
                        }
                      >
                        {page.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {isAdmin && (
            <div className="mt-2 space-y-1 border-t border-slate-200 pt-3 dark:border-slate-700">
        

              <NavLink
                to="/admin"
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
                {!collapsed && 'Painel Admin'}
              </NavLink>

              <NavLink
                to="/admin/users"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {!collapsed && 'Utilizadores'}
              </NavLink>

              <NavLink
                to="/admin/wallets"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {!collapsed && 'Carteiras'}
              </NavLink>

              <NavLink
                to="/admin/packages"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {!collapsed && 'Pacotes'}
              </NavLink>

              <NavLink
                to="/admin/subscriptions"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {!collapsed && 'Subscrições'}
              </NavLink>

              <NavLink
                to="/admin/transactions"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18" />
                </svg>
                {!collapsed && 'Transações'}
              </NavLink>

              <NavLink
                to="/admin/withdrawals"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {!collapsed && 'Saques'}
              </NavLink>

              <NavLink
                to="/admin/tickets"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h5" />
                </svg>
                {!collapsed && 'Tickets'}
              </NavLink>

              <NavLink
                to="/admin/kyc"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6a3 3 0 00-6 0v9" />
                </svg>
                {!collapsed && 'KYC'}
              </NavLink>

              <NavLink
                to="/admin/legal-pages"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16v4H4zm0 6h16v4H4zm0 6h16v2H4z" />
                </svg>
                {!collapsed && 'Páginas Legais'}
              </NavLink>

              <NavLink
                to="/admin/settings"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {!collapsed && 'Definições'}
              </NavLink>
            </div>
          )}

          <a
            href={`${API_BASE}/api-docs`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12a2 2 0 012 2v14a1 1 0 01-1.447.894L12 18.118l-6.553 3.776A1 1 0 014 20V6a2 2 0 012-2z" />
            </svg>
            {!collapsed && 'Documentação'}
          </a>
        </nav>

        {/* Footer do Sidebar - Perfil e Configurações */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          {/* Avatar e informações do usuário */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${collapsed ? 'justify-center' : ''}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg">
                <span className="text-sm font-semibold">
                  {getUserInitials()}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </p>
                </div>
              )}
              {!collapsed && (
                <svg className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="p-2">
                  {/* Perfil */}
                  <NavLink
                    to="/profile"
                    onClick={() => {
                      setDropdownOpen(false);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Perfil</span>
                  </NavLink>

                  {/* Modo Dark/Light */}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
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

                  {/* Idioma */}
                  <button
                    onClick={() => {
                      toggleLanguage();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
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

                  {/* Divider */}
                  <div className="my-2 border-t border-slate-200 dark:border-slate-700"></div>

                  {/* Sair */}
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950"
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
    </aside>
  );
}

export default Sidebar;