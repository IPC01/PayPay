import { Link } from 'react-router-dom';

function Sidebar({ open, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-2 p-4 text-sm font-medium text-slate-700">
          <Link to="/inicio" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            Início
          </Link>
          <Link to="/tarifas" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            Tarifas
          </Link>
          <Link to="/termos-de-condicao" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            Termos de condição
          </Link>
          <div className="pt-2">
            <Link
              to="/login"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white"
            >
              Entrar / Registar
            </Link>
          </div>
        </nav>
      </aside>
    </div>
  );
}

export default Sidebar;
