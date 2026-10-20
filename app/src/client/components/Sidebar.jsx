import DashboardSidebar from '../../shared/components/DashboardSidebar';

const navigation = [
  { 
    to: '/client', 
    label: 'Dashboard', 
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
  },
  { 
    to: '/client/wallets', 
    label: 'Carteiras', 
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' 
  },
  { 
    to: '/client/transactions', 
    label: 'Transações', 
    icon: 'M4 6h16M4 12h16M4 18h16' 
  },
  { 
    to: '/client/c2b', 
    label: 'C2B (Depósito)', 
    icon: 'M12 4v12m0 0l-4-4m4 4l4-4M4 20h16' 
  },
  { 
    to: '/client/withdrawals', 
    label: 'Saque', 
    icon: 'M12 20V8m0 0l-4 4m4-4l4 4M4 4h16' 
  },
  { 
    to: '/client/tokens', 
    label: 'Chaves de Acesso', 
    icon: 'M13 10V3L4 14h7v7l9-11h-7z' 
  },
  { 
    to: '/client/tickets', 
    label: 'Tickets', 
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
  },
  { 
    to: '/client/packages', 
    label: 'Pacotes', 
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm8-8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' 
  },
  { 
    to: '/client/kyc', 
    label: 'KYC', 
    icon: 'M12 3c4.97 0 9 2.46 9 5.5 0 2.82-3.8 5.17-8.83 5.81a1.5 1.5 0 01-1.34-.5 1.5 1.5 0 01-1.34.5C6.8 13.67 3 11.32 3 8.5 3 5.46 7.03 3 12 3z M12 12a2 2 0 100-4 2 2 0 000 4z' 
  },
  { 
    to: '/client/legal', 
    label: 'Legais', 
    icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0v6m0-6H9m3 0h3 M9 12h6' 
  }
];

function Sidebar(props) {
  return <DashboardSidebar navigation={navigation} {...props} />;
}

export default Sidebar;