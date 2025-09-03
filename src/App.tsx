import React, { useState } from 'react';
import SimpleAuth from './components/SimpleAuth';
import SongDurationTracker from './SongDurationTracker';
import RestoreData from './restore';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'viewer' | 'admin'>('viewer');

  const handleAuthenticated = (role: 'viewer' | 'admin') => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    // Completely clear authentication state
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole('viewer');
    // Force a page refresh to ensure clean state
    window.location.reload();
  };

  if (!isAuthenticated) {
    return <SimpleAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      <RestoreData />
      <SongDurationTracker userRole={userRole} onLogout={handleLogout} />
    </>
  );
};

export default App;
