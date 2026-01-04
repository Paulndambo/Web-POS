import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiPost } from '../utils/api.js';
import { BASE_URL } from '../config/currency.js';

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

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('pos_user');
    const storedAccessToken = localStorage.getItem('pos_access_token');
    const storedRefreshToken = localStorage.getItem('pos_refresh_token');
    
    if (storedUser && storedAccessToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

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
      localStorage.setItem('pos_access_token', data.access);
      localStorage.setItem('pos_refresh_token', data.refresh);
      
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
    setUser(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_access_token');
    localStorage.removeItem('pos_refresh_token');
  };

  const getAccessToken = () => {
    return localStorage.getItem('pos_access_token');
  };

  const getRefreshToken = () => {
    return localStorage.getItem('pos_refresh_token');
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

