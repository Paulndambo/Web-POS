import React, { createContext, useState, useContext, useEffect } from 'react';

const UsersContext = createContext(null);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Load users from localStorage
    const storedUsers = localStorage.getItem('pos_users');
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        setUsers(parsedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    } else {
      // Initialize with default admin user if no users exist
      const defaultUsers = [
        {
          id: '1',
          username: 'admin',
          name: 'John Doe',
          email: 'admin@example.com',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      setUsers(defaultUsers);
      localStorage.setItem('pos_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const addUser = (userData) => {
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const updatedUsers = [newUser, ...users];
    setUsers(updatedUsers);
    localStorage.setItem('pos_users', JSON.stringify(updatedUsers));
    return newUser;
  };

  const updateUser = (userId, updates) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return { ...user, ...updates, updatedAt: new Date().toISOString() };
      }
      return user;
    });
    setUsers(updatedUsers);
    localStorage.setItem('pos_users', JSON.stringify(updatedUsers));
    return updatedUsers.find(user => user.id === userId);
  };

  const deleteUser = (userId) => {
    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('pos_users', JSON.stringify(updatedUsers));
  };

  const value = {
    users,
    addUser,
    updateUser,
    deleteUser,
    totalUsers: users.length
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

