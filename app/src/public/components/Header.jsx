import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

const LANGUAGE_LABELS = {
  pt: 'Português',
  en: 'English',
};

const LANGUAGE_FLAGS = {
  pt: '🇵🇹',
  en: '🇬🇧',
};

function Header({ language, setLanguage, onOpenSidebar, platformName }) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = LANGUAGE_LABELS[language] || 'Português';
  const currentFlag = LANGUAGE_FLAGS[language] || '🇵🇹';

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setIsLanguageOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-md shadow-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/inicio" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700 hover:text-brand-800 transition-colors duration-200">
          <span className="hidden sm:inline">{platformName || 'PayPay'}</span>
          <span className="sm:hidden">{platformName?.charAt(0) || 'P'}</span>
        </Link>

        {/* Menu Desktop */}
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link 
            to="/inicio" 
            className="relative transition hover:text-brand-700 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-600 after:transition-all hover:after:w-full"
          >
            Início
          </Link>
          <Link 
            to="/tarifas" 
            className="relative transition hover:text-brand-700 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-600 after:transition-all hover:after:w-full"
          >
            Tarifas
          </Link>
          <Link 
            to="/termos-de-condicao" 
            className="relative transition hover:text-brand-700 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-600 after:transition-all hover:after:w-full"
          >
            Termos de condição
          </Link>
        </div>

        {/* Ações direitas */}
        <div className="flex items-center gap-3">
          {/* Botão do menu mobile */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 md:hidden"
            aria-label="Abrir menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {/* Seletor de idioma com globo */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-2 h-10 rounded-xl border border-slate-200 bg-white px-3 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              aria-label="Selecionar idioma"
            >
              <span className="text-lg" aria-hidden="true">
                <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
                  <path d="M3 12h18" />
                  <path d="M12 3c2.6 2.4 4 5.8 4 9s-1.4 6.6-4 9" />
                  <path d="M12 3c-2.6 2.4-4 5.8-4 9s1.4 6.6 4 9" />
                </svg>
              </span>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {currentFlag} {currentLabel}
              </span>
              <span className="text-sm font-medium text-slate-700 sm:hidden">
                {currentFlag}
              </span>
              <svg 
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isLanguageOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown de idiomas */}
            {isLanguageOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 py-1.5 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => handleLanguageChange(value)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                      language === value
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{LANGUAGE_FLAGS[value]}</span>
                    <span>{label}</span>
                    {language === value && (
                      <svg className="h-4 w-4 ml-auto text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão Entrar/Registar */}
          <Link
            to="/login"
            className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 text-sm font-semibold text-white shadow-md shadow-brand-600/30 hover:shadow-lg hover:shadow-brand-600/40 hover:scale-[1.02] hover:from-brand-700 hover:to-brand-800 transition-all duration-200"
          >
            Entrar / Registar
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;