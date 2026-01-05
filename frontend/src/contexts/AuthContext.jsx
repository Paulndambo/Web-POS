import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiPost } from '../utils/api.js';
import { BASE_URL } from '../config/currency.js';
import { setAuthTokens, getAuthTokens, clearAuthTokens, isTokenExpired } from '../utils/cookies.js';
import { showWarning } from '../utils/toast.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout function that clears both cookies and state
  const performLogout = useCallback(() => {
    setUser(null);
    clearAuthTokens();
    localStorage.removeItem('pos_user');
  }, []);

  useEffect(() => {
    // Check if user is logged in from cookies
    const storedUser = localStorage.getItem('pos_user');
    const { accessToken } = getAuthTokens();
    
    if (storedUser && accessToken) {
      // Check if token is expired
      if (isTokenExpired()) {
        // Token expired, log user out
        performLogout();
      } else {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, [performLogout]);

  // Check token expiration periodically (every minute)
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired()) {
        console.log('Access token expired, logging out...');
        showWarning('Your session has expired. Please login again.');
        performLogout();
        // Redirect to login page
        window.location.href = '/login';
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, performLogout]);

  const login = async (username, password) => {
    try {
      // Login endpoint doesn't require authentication
      const response = await apiPost('/users/login/', {
        username,
        password
      }, false);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || errorData.message || 'Invalid username or password' 
        };
      }

      const data = await response.json();
      
      // Store user data and tokens
      const userData = {
        ...data.user,
        name: `${data.user.first_name} ${data.user.last_name}`.trim()
      };
      
      setUser(userData);
      localStorage.setItem('pos_user', JSON.stringify(userData));
      
      // Store tokens in cookies with 1 hour expiration for access token
      // and 24 hours for refresh token
      setAuthTokens(data.access, data.refresh, 1, 24);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Unable to connect to server. Please try again.' 
      };
    }
  };

  const logout = () => {
    performLogout();
  };

  const getAccessToken = () => {
    const { accessToken } = getAuthTokens();
    return accessToken;
  };

  const getRefreshToken = () => {
    const { refreshToken } = getAuthTokens();
    return refreshToken;
  };

  const value = {
    user,
    login,
    logout,
    getAccessToken,
    getRefreshToken,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

