import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ShoppingCart } from 'lucide-react';

const OnboardingSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="text-green-600" size={64} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          <ShoppingCart className="text-blue-600" size={32} />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Onboarding Successful!
          </h1>
        </div>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Congratulations! Your business has been successfully onboarded to our Point of Sale platform.
          You can now sign in with your manager credentials to start managing your operations.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">What's Next?</h2>
          <ul className="text-left space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
              <span>Sign in with your manager email and credentials</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
              <span>Set up your inventory and products</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
              <span>Configure your payment methods</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
              <span>Start processing sales and managing your business</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/login', { replace: true })}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 mx-auto shadow-md hover:shadow-lg"
        >
          Go to Login Page
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default OnboardingSuccess;
