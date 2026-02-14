import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardPro } from '../components/dashboard/DashboardPro';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return <DashboardPro />;
}
