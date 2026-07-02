import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const contentOffsetClass = sidebarCollapsed ? 'pl-20' : 'pl-80';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <button
        type="button"
        onClick={() => setSidebarCollapsed((prev) => !prev)}
        className="fixed top-3 z-50 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-md backdrop-blur transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/95 dark:text-slate-300 dark:hover:bg-slate-700"
        style={{ left: sidebarCollapsed ? '4rem' : '19rem' }}
        aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {sidebarCollapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
        </svg>
      </button>
      <div className={`flex min-h-screen flex-col transition-all duration-300 ${contentOffsetClass}`}>
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-none px-3 py-3 sm:px-4 lg:px-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;