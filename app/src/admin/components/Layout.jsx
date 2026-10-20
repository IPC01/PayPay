import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const contentOffsetClass = sidebarCollapsed ? 'md:pl-16' : 'md:pl-60';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />
      <div className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ${contentOffsetClass}`}>
        <Header mobileSidebarOpen={mobileSidebarOpen} onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className="dashboard-content min-w-0 flex-1">
          <div className="mx-auto max-w-none px-3 py-3 sm:px-4 lg:px-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;