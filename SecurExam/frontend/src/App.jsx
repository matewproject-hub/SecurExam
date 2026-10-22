import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Header from './components/Header';
import PublicLogin from './views/PublicLogin';
import SupervisorDashboard from './views/SupervisorDashboard';
import AdminDashboard from './views/AdminDashboard';
import ScrutinyDashboard from './views/ScrutinyDashboard';
import AuditorDashboard from './views/AuditorDashboard';
import CenterDashboard from './views/CenterDashboard';
import StudentDashboard from './views/StudentDashboard';

function MainRouter() {
  const { user, navigate } = useAuth();

  const renderView = () => {
    if (user) {
      switch (user.role) {
        case 'Supervisor':
          return <SupervisorDashboard />;
        case 'Admin':
          return <AdminDashboard />;
        case 'Scrutiny Officer':
          return <ScrutinyDashboard />;
        case 'Auditor':
          return <AuditorDashboard />;
        case 'Center':
          return <CenterDashboard />;
        case 'Student':
          return <StudentDashboard />;
        default:
          return <PublicLogin />;
      }
    }

    return <PublicLogin />;
  };

  return (
    <div className="app-shell">
      <Header onNavigate={navigate} />
      {renderView()}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainRouter />
      </DataProvider>
    </AuthProvider>
  );
}
