import React, { useState, useEffect } from 'react';

interface SimpleAuthProps {
  onAuthenticated: () => void;
}

const SimpleAuth: React.FC<SimpleAuthProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if already authenticated on load
  useEffect(() => {
    const auth = localStorage.getItem('massey-hall-auth');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
      onAuthenticated();
    }
  }, [onAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple password check
    if (password === '2025') {
      localStorage.setItem('massey-hall-auth', 'authenticated');
      setIsAuthenticated(true);
      onAuthenticated();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return null; // Don't render anything if authenticated
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">🎵 Massey Hall</h1>
          <h2 className="text-xl text-slate-300 mb-4">Song List 2025</h2>
          <p className="text-slate-400 text-sm">Please enter the password to access the song tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Access Song Tracker
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">
            For band members only • November 15, 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuth;
