// Header.jsx
import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useUi } from '../../contexts/UiContext';

function Header({ onToggleSidebar, sidebarOpen }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { theme, language, toggleTheme, toggleLanguage } = useUi();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-none items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Botão de menu mobile */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-all duration-200 hover:border-[#3B82F6] hover:bg-[#F8FAFC] hover:text-[#1D4ED8]"
            aria-label="Abrir menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82F6]">
              Área Administrativa
            </p>
            <h1 className="text-lg font-semibold text-[#0F172A]">
              {settings?.platformName || 'Painel Administrativo'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/notifications')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-all duration-200 hover:border-[#3B82F6] hover:text-[#1D4ED8] hover:bg-[#F8FAFC]"
            aria-label="Notificações"
            title="Notificações"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 17v1a3 3 0 11-6 0v-1" />
            </svg>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition-all duration-200 hover:bg-[#F8FAFC]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] text-white shadow-md shadow-[#1D4ED8]/25">
                {getUserInitials()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-[#0F172A]">{user?.name || 'Administrador'}</span>
                <span className="block text-xs text-[#64748B]">{user?.email}</span>
              </span>
              <svg 
                className={`h-4 w-4 text-[#94A3B8] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E2E8F0] bg-white shadow-xl shadow-[#0F172A]/5">
                <div className="border-b border-[#E2E8F0] p-4">
                  <p className="text-sm font-semibold text-[#0F172A]">{user?.name}</p>
                  <p className="mt-0.5 text-xs text-[#64748B]">{user?.email}</p>
                </div>
                <div className="p-2">
                  <NavLink
                    to="/admin/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC]"
                  >
                    <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC]"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC]"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      <span>Idioma</span>
                    </span>
                    <span className="text-xs font-medium text-[#64748B]">{language.toUpperCase()}</span>
                  </button>
                  <div className="my-2 border-t border-[#E2E8F0]" />
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-all duration-200 hover:bg-red-50"
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