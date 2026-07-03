import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { UiProvider } from './contexts/UiContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Notifications from './components/Notifications';
import RequireAuth from './components/RequireAuth';
import ClientLayout from './client/components/Layout';
import AdminLayout from './admin/components/Layout';
import Dashboard from './client/pages/Dashboard';
import Wallet from './client/pages/Wallet';
import TokenCreate from './client/pages/TokenCreate';
import Login from './client/pages/Login';
import Register from './client/pages/Register';
import Profile from './client/pages/Profile';
import Transactions from './client/pages/Transactions';
import TransactionsC2B from './client/pages/TransactionsC2B';
import TransactionsB2C from './client/pages/TransactionsB2C';
import Tickets from './client/pages/Tickets';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUsers from './admin/pages/AdminUsers';
import AdminWallets from './admin/pages/AdminWallets';
import AdminTransactions from './admin/pages/AdminTransactions';
import AdminTickets from './admin/pages/AdminTickets';
import AdminWithdrawals from './admin/pages/AdminWithdrawals';
import AdminKyc from './admin/pages/AdminKyc';
import AdminPackages from './admin/pages/AdminPackages';
import AdminSubscriptions from './admin/pages/AdminSubscriptions';
import AdminLegalPages from './admin/pages/AdminLegalPages';
import AdminSettings from './admin/pages/AdminSettings';
import NotificationsPage from './client/pages/NotificationsPage';
import Packages from './client/pages/Packages';
import Withdrawals from './client/pages/Withdrawals';
import LegalPages from './client/pages/LegalPages';
import LegalPageView from './client/pages/LegalPageView';
import Kyc from './client/pages/Kyc';
import ForgotPassword from './client/pages/ForgotPassword';
import ResetPassword from './client/pages/ResetPassword';
import RequireAdmin from './components/RequireAdmin';

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.roleId === 1) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/client" replace />;
}

function ClientRoute({ children }) {
  return (
    <RequireAuth>
      <ClientLayout>{children}</ClientLayout>
    </RequireAuth>
  );
}

function AdminRoute({ children }) {
  return (
    <RequireAuth>
      <RequireAdmin>
        <AdminLayout>{children}</AdminLayout>
      </RequireAdmin>
    </RequireAuth>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <UiProvider>
          <NotificationProvider>
            <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route
            path="/client"
            element={
              <ClientRoute>
                <Dashboard />
              </ClientRoute>
            }
          />
          <Route
            path="/client/wallets"
            element={
              <ClientRoute>
                <Wallet />
              </ClientRoute>
            }
          />
          <Route
            path="/client/wallets/:id"
            element={<Navigate to="/client/wallets" replace />}
          />
          <Route
            path="/client/withdrawals"
            element={
              <ClientRoute>
                <Withdrawals />
              </ClientRoute>
            }
          />
          <Route
            path="/client/tokens"
            element={
              <ClientRoute>
                <TokenCreate />
              </ClientRoute>
            }
          />
          <Route
            path="/client/tickets"
            element={
              <ClientRoute>
                <Tickets />
              </ClientRoute>
            }
          />
          <Route
            path="/client/kyc"
            element={
              <ClientRoute>
                <Kyc />
              </ClientRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={<Navigate to="/admin/users" replace />}
          />
          <Route
            path="/admin/wallets"
            element={
              <AdminRoute>
                <AdminWallets />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/wallets/:id"
            element={<Navigate to="/admin/wallets" replace />}
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AdminTransactions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <AdminRoute>
                <AdminTickets />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminRoute>
                <Profile />
              </AdminRoute>
            }
          />
          <Route
            path="/client/profile"
            element={
              <ClientRoute>
                <Profile />
              </ClientRoute>
            }
          />
          <Route
            path="/client/notifications"
            element={
              <ClientRoute>
                <NotificationsPage />
              </ClientRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <NotificationsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/client/transactions"
            element={
              <ClientRoute>
                <Transactions />
              </ClientRoute>
            }
          />
          <Route
            path="/client/transactions/c2b"
            element={
              <ClientRoute>
                <TransactionsC2B />
              </ClientRoute>
            }
          />
          <Route
            path="/client/transactions/b2c"
            element={
              <ClientRoute>
                <TransactionsB2C />
              </ClientRoute>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <AdminRoute>
                <AdminWithdrawals />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/subscriptions"
            element={
              <AdminRoute>
                <AdminSubscriptions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/packages"
            element={
              <AdminRoute>
                <AdminPackages />
              </AdminRoute>
            }
          />
          <Route
            path="/client/packages"
            element={
              <ClientRoute>
                <Packages />
              </ClientRoute>
            }
          />
          <Route
            path="/admin/kyc"
            element={
              <AdminRoute>
                <AdminKyc />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/kyc/:id"
            element={<Navigate to="/admin/kyc" replace />}
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/legal-pages"
            element={
              <AdminRoute>
                <AdminLegalPages />
              </AdminRoute>
            }
          />
          <Route
            path="/client/legal"
            element={
              <ClientRoute>
                <LegalPages />
              </ClientRoute>
            }
          />
          <Route
            path="/client/legal/:slug"
            element={
              <ClientRoute>
                <LegalPageView />
              </ClientRoute>
            }
          />
          <Route path="/wallets" element={<Navigate to="/client/wallets" replace />} />
          <Route path="/wallets/:id" element={<Navigate to="/client/wallets" replace />} />
          <Route path="/withdrawals" element={<Navigate to="/client/withdrawals" replace />} />
          <Route path="/tokens" element={<Navigate to="/client/tokens" replace />} />
          <Route path="/tickets" element={<Navigate to="/client/tickets" replace />} />
          <Route path="/kyc" element={<Navigate to="/client/kyc" replace />} />
          <Route path="/profile" element={<Navigate to="/client/profile" replace />} />
          <Route path="/notifications" element={<Navigate to="/client/notifications" replace />} />
          <Route path="/transactions" element={<Navigate to="/client/transactions" replace />} />
          <Route path="/transactions/c2b" element={<Navigate to="/client/transactions/c2b" replace />} />
          <Route path="/transactions/b2c" element={<Navigate to="/client/transactions/b2c" replace />} />
          <Route path="/packages" element={<Navigate to="/client/packages" replace />} />
          <Route path="/company-info" element={<Navigate to="/client/profile" replace />} />
          <Route path="/legal" element={<Navigate to="/client/legal" replace />} />
          <Route path="/legal/:slug" element={<Navigate to="/client/legal" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/client" replace />} />
        </Routes>
          <Notifications />
        </NotificationProvider>
      </UiProvider>
    </AuthProvider>
  </SettingsProvider>
  );
}

export default App;
