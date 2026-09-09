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
          ? 'bg-white shadow-lg shadow-gray-200/50 border-b border-gray-200/50'
          : 'bg-white/90 backdrop-blur-sm border-b border-gray-200/30'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center transition-transform duration-200 hover:scale-[1.02]"
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
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive(link.to)
                  ? 'text-gray-800 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-gray-700" />
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:border-gray-600 hover:text-gray-800 md:hidden"
            aria-label="Abrir menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {/* Botão Entrar/Registar - Versão Desktop */}
          <Link
            to="/login"
            className="group relative hidden md:inline-flex h-10 items-center overflow-hidden rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 px-5 text-sm font-semibold text-white shadow-md shadow-gray-800/25 transition-all duration-200 hover:shadow-lg hover:shadow-gray-800/35 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Entrar
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-gray-900 to-gray-800 transition-transform duration-300 group-hover:translate-x-0" />
          </Link>

          {/* Botão Entrar/Registar - Versão Mobile (apenas ícone) */}
          <Link
            to="/login"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:border-gray-600 hover:text-gray-800 md:hidden"
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