import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import Dashboard from './client/Dashboard';
import WalletCreate from './client/WalletCreate';
import TokenCreate from './client/TokenCreate';
import Login from './client/Login';
import Register from './client/Register';
import Profile from './client/Profile';
import Transactions from './client/Transactions';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/wallets/create"
            element={
              <RequireAuth>
                <WalletCreate />
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
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
