import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShoppingCart, CheckCircle, Zap, Shield, BarChart3, ArrowRight } from 'lucide-react';
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

  // Features list for the left column
  const features = [
    { icon: Zap, text: 'Lightning-fast transactions' },
    { icon: BarChart3, text: 'Real-time analytics & reports' },
    { icon: Shield, text: 'Secure & reliable platform' },
    { icon: ShoppingCart, text: 'Complete inventory management' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {showLogin ? (
        <div className="w-full max-w-full lg:max-w-[98%] xl:max-w-[1600px] bg-white rounded-none lg:rounded-2xl shadow-xl overflow-hidden min-h-screen lg:min-h-[600px] mx-0 lg:mx-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen lg:min-h-[600px]">
            {/* Left Column - Platform Info */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-20 -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full opacity-20 -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <ShoppingCart className="text-white" size={32} />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold">Point of Sale</h1>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Streamline Your Business Operations
                </h2>
                
                <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                  A comprehensive POS solution designed to help you manage sales, inventory, and customers all in one place. Get started today and transform how you run your business.
                </p>

                <div className="space-y-4 mb-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                          <Icon size={20} className="text-white" />
                        </div>
                        <span className="text-blue-50 text-base">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative z-10">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-6">
                  <p className="text-white text-sm mb-4 font-medium">
                    New to our platform?
                  </p>
                  <p className="text-blue-100 text-sm mb-4">
                    Set up your business in minutes and start managing your operations with ease.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('onboarding')}
                    className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Get Started
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              <div className="max-w-lg mx-auto w-full">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                  <p className="text-gray-600">Sign in to access your POS dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
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
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 text-base shadow-md hover:shadow-lg"
                  >
                    <LogIn size={20} />
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Business Onboarding</h2>
            </div>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Back to Login
            </button>
          </div>
          <BusinessOnboarding
            onCompleted={() => {
              setMode('login');
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Login;

