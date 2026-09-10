import { NavLink } from 'react-router-dom';
import { apiUrl } from '../../services/api';

const navigation = [
  { 
    to: '/admin', 
    label: 'Dashboard', 
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
  },
  { 
    to: '/admin/users', 
    label: 'Utilizadores', 
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' 
  },
  { 
    to: '/admin/wallets', 
    label: 'Carteiras', 
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' 
  },
  { 
    to: '/admin/transactions', 
    label: 'Transações', 
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' 
  },
  { 
    to: '/admin/tickets', 
    label: 'Tickets', 
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' 
  },
  { 
    to: '/admin/withdrawals', 
    label: 'Saques', 
    icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 6v6m0-6H9m3 0h3' 
  },
  { 
    to: '/admin/kyc', 
    label: 'KYC', 
    icon: 'M12 3c4.97 0 9 2.46 9 5.5 0 2.82-3.8 5.17-8.83 5.81a1.5 1.5 0 01-1.34-.5 1.5 1.5 0 01-1.34.5C6.8 13.67 3 11.32 3 8.5 3 5.46 7.03 3 12 3z M12 12a2 2 0 100-4 2 2 0 000 4z' 
  },
  { 
    to: '/admin/packages', 
    label: 'Pacotes', 
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm8-8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' 
  },
  { 
    to: '/admin/subscriptions', 
    label: 'Subscrições', 
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' 
  },
  { 
    to: '/admin/legal-pages', 
    label: 'Páginas Legais', 
    icon: 'M6 4h12v16H6V4zm2 4h8M8 8h8M8 12h6m-6 4h8' 
  },
  { 
    to: '/admin/settings', 
    label: 'Configurações', 
    icon: 'M12 8a4 4 0 100 8 4 4 0 000-8z M15.32 6.5l.58-.58a.41.41 0 01.58 0l1.59 1.59a.41.41 0 010 .58l-.58.58M8.68 17.5l-.58.58a.41.41 0 01-.58 0l-1.59-1.59a.41.41 0 010-.58l.58-.58M17.5 8.68l.58.58a.41.41 0 010 .58l-1.59 1.59a.41.41 0 01-.58 0l-.58-.58M6.5 15.32l-.58.58a.41.41 0 000 .58l1.59 1.59a.41.41 0 00.58 0l.58-.58' 
  }
];

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gray-800 text-white shadow-lg shadow-gray-200'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    } ${collapsed ? 'justify-center px-2' : ''}`;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 overflow-y-auto border-r border-gray-200 bg-white shadow-lg transition-transform duration-300 md:transition-all md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-10 w-[120px] items-center">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-30 h-20"
                />
              </div>
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-800"
                aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
              >
                <svg className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-800 md:hidden"
                aria-label="Fechar menu"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                className={navLinkClass} 
                end={item.to === '/admin'} 
                onClick={() => setMobileOpen(false)}
              >
                <svg className="h-5 w-5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}

            <a
              href={apiUrl('/docs')}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 ${
                collapsed ? 'justify-center px-2' : ''
              }`}
            >
              <svg className="h-5 w-5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {!collapsed && <span>Documentação</span>}
            </a>
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;