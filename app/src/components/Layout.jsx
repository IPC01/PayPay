import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/wallets/create', label: 'Criar carteira' },
  { to: '/tokens', label: 'Tokens' },
  { to: '/transactions', label: 'Transações' },
  { to: '/profile', label: 'Perfil' }
];

function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 md:hidden"
              >
                <span className="sr-only">Abrir menu</span>
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Payments System</p>
              <h1 className="text-2xl font-semibold text-slate-900">Painel de Gestão</h1>
            </div>
          </div>
          {user && (
            <div className="hidden items-center gap-4 md:flex">
              {links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <button onClick={logout} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {user ? (
          <>
            <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto border-r border-slate-200 bg-white/95 p-6 shadow-xl transition duration-300 md:static md:translate-x-0 md:block ${open ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">Menu</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Navegação</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 md:hidden"
                >
                  <span className="sr-only">Fechar menu</span>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                {links.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`
                    }
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-10 rounded-3xl border border-slate-200 bg-brand-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Conta</p>
                <p className="mt-3 text-sm text-slate-600">{user?.name}</p>
                <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
              </div>
            </aside>

            <div className="flex-1 md:ml-72">
              <div className="md:hidden">
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Resumo</p>
                  <p className="mt-2 text-base text-slate-700">Use o botão do menu para navegar pelo sistema.</p>
                </div>
              </div>
              <div className="rounded-[2rem] bg-slate-50 p-0 md:p-0">{children}</div>
            </div>
          </>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </div>
  );
}

export default Layout;
