import { useSettings } from '../../contexts/SettingsContext';

function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useSettings();
  
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            © {currentYear} {settings?.platformName || 'SAMPAY'}. Todos os direitos reservados.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-600 dark:text-slate-400 transition hover:text-brand-600 dark:hover:text-brand-400">
              Termos de Uso
            </a>
            <a href="#" className="text-sm text-slate-600 dark:text-slate-400 transition hover:text-brand-600 dark:hover:text-brand-400">
              Privacidade
            </a>
            <a href="#" className="text-sm text-slate-600 dark:text-slate-400 transition hover:text-brand-600 dark:hover:text-brand-400">
              Suporte
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;