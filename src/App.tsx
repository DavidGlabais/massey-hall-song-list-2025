import React, { useState, useEffect } from 'react';
import SimpleAuth from './components/SimpleAuth';
import SongDurationTracker from './SongDurationTracker';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'viewer' | 'admin'>('viewer');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('massey-hall-auth');
    const role = localStorage.getItem('massey-hall-role') as 'viewer' | 'admin';
    if (auth === 'authenticated' && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
    setIsLoading(false);
  }, []);

  const handleAuthenticated = (role: 'viewer' | 'admin') => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('massey-hall-auth');
    localStorage.removeItem('massey-hall-role');
    setIsAuthenticated(false);
    setUserRole('viewer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SimpleAuth onAuthenticated={handleAuthenticated} />;
  }

  return <SongDurationTracker userRole={userRole} onLogout={handleLogout} />;
};

export default App;
