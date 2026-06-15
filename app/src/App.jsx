import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UiProvider } from './contexts/UiContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Notifications from './components/Notifications';
import RequireAuth from './components/RequireAuth';
import Dashboard from './client/Dashboard';
import Wallet from './client/Wallet';
import TokenCreate from './client/TokenCreate';
import Login from './client/Login';
import Register from './client/Register';
import Profile from './client/Profile';
import Transactions from './client/Transactions';
import Tickets from './client/Tickets';
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminUserDetails from './admin/AdminUserDetails';
import AdminWallets from './admin/AdminWallets';
import AdminTransactions from './admin/AdminTransactions';
import AdminTickets from './admin/AdminTickets';
import AdminWithdrawals from './admin/AdminWithdrawals';
import Layout from './components/Layout';
import NotificationsPage from './client/NotificationsPage';
import WalletDetails from './client/WalletDetails';
import RequireAdmin from './components/RequireAdmin';

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user?.roleId === 1) {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <UiProvider>
        <NotificationProvider>
          <Layout>
            <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomeRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/wallets"
            element={
              <RequireAuth>
                <Wallet />
              </RequireAuth>
            }
          />
          <Route
            path="/wallets/:id"
            element={
              <RequireAuth>
                <WalletDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/tokens"
            element={
              <RequireAuth>
                <TokenCreate />
              </RequireAuth>
            }
          />
          <Route
            path="/tickets"
            element={
              <RequireAuth>
                <Tickets />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminUsers />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminUserDetails />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/wallets"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminWallets />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminTransactions />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminTickets />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/transactions"
            element={
              <RequireAuth>
                <Transactions />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminWithdrawals />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Layout>
          <Notifications />
        </NotificationProvider>
      </UiProvider>
    </AuthProvider>
  );
}

export default App;
