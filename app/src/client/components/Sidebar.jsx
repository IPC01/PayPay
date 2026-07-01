import { NavLink } from 'react-router-dom';

const navigation = [
  { to: '/client', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/client/wallets', label: 'Carteiras', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { to: '/client/withdrawals', label: 'Saques', icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 6v6m0-6H9m3 0h3' },
  { to: '/client/tokens', label: 'Chaves de Acesso', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { to: '/client/transactions', label: 'Transações', icon: 'M4 6h16M4 12h16M4 18h16', children: [
    { to: '/client/transactions/c2b', label: 'C2B' },
    { to: '/client/transactions/b2c', label: 'B2C' }
  ] },
  { to: '/client/tickets', label: 'Tickets', icon: 'M4 4h16v16H4z' },
  { to: '/client/packages', label: 'Pacotes', icon: 'M4 6h16M4 12h16M4 18h16' },
  { to: '/client/kyc', label: 'KYC', icon: 'M12 3c4.97 0 9 2.46 9 5.5 0 2.82-3.8 5.17-8.83 5.81a1.5 1.5 0 01-1.34-.5 1.5 1.5 0 01-1.34.5C6.8 13.67 3 11.32 3 8.5 3 5.46 7.03 3 12 3z' },
  { to: '/client/company-info', label: 'Empresa', icon: 'M6 4h12v16H6z' },
  { to: '/client/legal', label: 'Legais', icon: 'M6 4h12v16H6z' },
  { to: '/client/notifications', label: 'Notificações', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1' }
];

function Sidebar({ collapsed, setCollapsed }) {

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-950'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    } ${collapsed ? 'justify-center px-2' : ''}`;

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 overflow-y-auto border-r border-slate-200 bg-white/95 backdrop-blur-md shadow-xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/95 translate-x-0 ${collapsed ? 'w-20' : 'w-80'}`}>
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 10h18M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {!collapsed && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Cliente</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Área do Cliente</p>
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
                  {collapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <div key={item.to} className="space-y-1">
              <NavLink to={item.to} className={navLinkClass} end={item.to === '/client'}>
                <svg className="h-5 w-5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
              {!collapsed && item.children && (
                <div className="ml-9 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;