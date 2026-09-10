import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Header({ onOpenSidebar, platformName }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
      className={`sticky top-0 z-30 transition-all duration-500 ${isScrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border-b border-white/20'
          : 'bg-white/60 backdrop-blur-md border-b border-white/10'
        }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center transition-all duration-500 hover:scale-[1.02]"
        >
          <div className="flex h-10 w-[120px] items-center">
            <img
              src="/logo.png"
              alt={platformName || "Logo"}
              className="w-30 h-20"
            />
          </div>
        </Link>

        {/* Menu Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive(link.to)
                  ? 'text-gray-900 bg-gray-100/80 backdrop-blur-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
                }`}
            >
              {link.label}
              {isActive(link.to) && (
                <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-gray-600 to-gray-400" />
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200/50 bg-white/50 text-gray-500 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:border-gray-400 hover:text-gray-800 hover:shadow-lg hover:shadow-gray-200/50 md:hidden"
            aria-label="Abrir menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {/* Botão Futurista Único - Desktop */}
          <div className="hidden md:block">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 hover:bg-gray-100"
            >
              Acessar Conta
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Botões Mobile (apenas ícones) */}
          <div className="flex items-center gap-1 md:hidden">
            <Link
              to="/login"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg shadow-gray-800/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-gray-800/35"
              aria-label="Entrar / Registrar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {/* Badge de "Novo" */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white shadow-lg shadow-emerald-500/50 animate-pulse">
                +
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;