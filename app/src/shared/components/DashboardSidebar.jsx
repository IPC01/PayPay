import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { apiUrl } from '../../services/api';

function DashboardSidebar({ navigation, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const sidebarRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    closeRef.current?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key !== 'Tab') return;
      const controls = [...sidebarRef.current.querySelectorAll('a[href], button')]
        .filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.querySelector('button[aria-label="Abrir menu"]')?.focus({ preventScroll: true });
    };
  }, [mobileOpen, setMobileOpen]);

  const linkClass = (isActive) =>
    `flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:min-h-10 ${
      isActive
        ? 'bg-gray-800 text-white dark:bg-slate-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
    } ${collapsed ? 'md:justify-center md:px-2' : ''}`;
  const labelClass = collapsed ? 'md:sr-only' : '';

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        ref={sidebarRef}
        id="dashboard-sidebar"
        aria-label="Menu principal"
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[calc(100vw-3rem)] border-r border-gray-200 bg-white transition-transform duration-300 dark:border-slate-700 dark:bg-slate-800 md:visible md:translate-x-0 md:transition-[width] ${
          mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        } ${collapsed ? 'md:w-16' : 'md:w-60'}`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-14 shrink-0 items-center justify-center border-b border-gray-200 px-3 dark:border-slate-700">
            <img src="/logo.png" alt="Logo" className="h-12 max-w-full object-contain" />
          </div>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/client' || item.to === '/admin' || item.to === '/operador'}
                className={({ isActive }) => linkClass(isActive)}
                title={item.label}
                onClick={() => setMobileOpen(false)}
              >
                <svg aria-hidden="true" className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className={labelClass}>{item.label}</span>
              </NavLink>
            ))}
            <a href={apiUrl('/docs')} target="_blank" rel="noreferrer" title="Documentação" className={linkClass(false)}>
              <svg aria-hidden="true" className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className={labelClass}>Documentação</span>
            </a>
          </nav>
        </div>
        <button
          type="button"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          aria-controls="dashboard-sidebar"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 top-7 hidden h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 md:inline-flex"
        >
          <svg aria-hidden="true" className={`h-4 w-4 ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14 18-6-6 6-6" />
          </svg>
        </button>
        <button
          ref={closeRef}
          type="button"
          aria-label="Fechar menu"
          aria-controls="dashboard-sidebar"
          onClick={() => setMobileOpen(false)}
          className="absolute right-0 top-7 inline-flex h-11 w-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 md:hidden"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </aside>
    </>
  );
}

export default DashboardSidebar;
