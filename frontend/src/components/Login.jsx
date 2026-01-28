import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShoppingCart } from 'lucide-react';
import BusinessOnboarding from './BusinessOnboarding.jsx';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'onboarding'
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showLogin = mode === 'login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-3xl">
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-full mb-3 sm:mb-4">
            <ShoppingCart className="text-white" size={24} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Point of Sale</h1>
          <p className="text-xs sm:text-sm text-gray-600">
            {showLogin
              ? 'Sign in to access your POS dashboard.'
              : 'Set up your business, main branch and admin user in a few quick steps.'}
          </p>
        </div>

        <div className="mb-5 sm:mb-6 flex rounded-full bg-gray-100 p-1 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-full font-semibold transition ${
              showLogin ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Existing business login
          </button>
          <button
            type="button"
            onClick={() => setMode('onboarding')}
            className={`flex-1 py-2 rounded-full font-semibold transition ${
              !showLogin ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            New business onboarding
          </button>
        </div>

        {showLogin ? (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <LogIn size={18} />
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className="text-[11px] sm:text-xs text-gray-500 text-center">
              Don&apos;t have a business account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('onboarding')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Start onboarding
              </button>
            </p>
          </form>
        ) : (
          <BusinessOnboarding
            onCompleted={() => {
              setMode('login');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Login;

