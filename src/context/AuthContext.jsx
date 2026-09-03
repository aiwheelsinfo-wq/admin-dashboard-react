import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const ADMIN_EMAIL = 'agnicarrental@gmail.com';
const ADMIN_PASSWORD = 'rentox@123';
const AUTH_STORAGE_KEY = 'rentox_admin_auth';

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    // Normalizing email comparison
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (cleanEmail === ADMIN_EMAIL && cleanPass === ADMIN_PASSWORD) {
      const userSession = {
        email: ADMIN_EMAIL,
        name: 'SuperAdmin',
        role: 'admin',
        loginTime: Date.now()
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
      setAdminUser(userSession);
      return { success: true };
    } else {
      return { 
        success: false, 
        message: 'Invalid credentials. Please enter authorized admin email and password.' 
      };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setAdminUser(null);
  };

  const isAuthenticated = Boolean(adminUser);

  return (
    <AuthContext.Provider value={{ adminUser, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
