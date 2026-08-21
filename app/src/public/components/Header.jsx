import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Header({ onOpenSidebar, platformName }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Detecta scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { to: '/', label: 'Início' },
    { to: '/tarifas', label: 'Tarifas' },
    { to: '/termos-de-condicao', label: 'Termos' },
  ];

  return (
    <header 
      className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-slate-200/50 border-b border-slate-200/50' 
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-200/30'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link 
          to="/" 
          className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] text-white shadow-md shadow-[#1D4ED8]/20 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-[#1D4ED8]/30">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span 
            className="text-xl font-bold tracking-tight text-[#0F172A] transition-colors duration-200 group-hover:text-[#1D4ED8]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {platformName || 'PayPay'}
          </span>
        </Link>

        {/* Menu Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive(link.to)
                  ? 'text-[#1D4ED8] bg-[#EFF6FF]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[#3B82F6]" />
              )}
            </Link>
          ))}
        </div>

        {/* Ações direitas */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão do menu mobile */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-all duration-200 hover:bg-[#F8FAFC] hover:border-[#3B82F6] hover:text-[#1D4ED8] md:hidden"
            aria-label="Abrir menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {/* Botão Entrar/Registar - Versão Desktop */}
          <Link
            to="/login"
            className="group relative hidden md:inline-flex h-10 items-center overflow-hidden rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-5 text-sm font-semibold text-white shadow-md shadow-[#1D4ED8]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#1D4ED8]/35 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Entrar
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] transition-transform duration-300 group-hover:translate-x-0" />
          </Link>

          {/* Botão Entrar/Registar - Versão Mobile (apenas ícone) */}
          <Link
            to="/login"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-all duration-200 hover:bg-[#F8FAFC] hover:border-[#3B82F6] hover:text-[#1D4ED8] md:hidden"
            aria-label="Entrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;