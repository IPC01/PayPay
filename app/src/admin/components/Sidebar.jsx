import DashboardSidebar from '../../shared/components/DashboardSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessManagement, isOperator, managementPath } from '../../helpers/roles';

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
    to: '/admin/wallet-types', 
    label: 'Tipos de Carteira', 
    icon: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 4h18' 
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

function Sidebar(props) {
  const { user } = useAuth();
  const items = navigation.map((item) => ({
    ...item,
    to: managementPath(user, item.to),
    label: isOperator(user) && item.to === '/admin/users' ? 'Clientes' : item.label
  })).filter((item) => canAccessManagement(user, item.to));
  return <DashboardSidebar navigation={items} {...props} />;
}

export default Sidebar;