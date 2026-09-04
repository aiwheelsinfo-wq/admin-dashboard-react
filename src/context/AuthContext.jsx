import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { endpoints } from '../config/api';

const AuthContext = createContext(null);

const DEFAULT_ADMIN_EMAIL = 'agnicarrental@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'rentox@123';
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
    const cleanEmail = (email || '').trim();
    const cleanPass = (password || '').trim();

    // 1. Try Live AWS Database Verification
    try {
      const response = await axios.post(
        endpoints.adminAccountSettings,
        {
          action: 'verify_login',
          email: cleanEmail,
          password: cleanPass
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      if (response.data && response.data.status === 'success') {
        const adminData = response.data.data || {};
        const userSession = {
          email: adminData.email || cleanEmail,
          name: adminData.userName || 'SuperAdmin',
          role: adminData.role || 'admin',
          id: adminData.id || 1,
          loginTime: Date.now()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
        setAdminUser(userSession);
        return { success: true };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Invalid admin credentials.'
        };
      }
    } catch (networkError) {
      console.warn('Live auth request failed, attempting fallback check:', networkError);

      // 2. Fallback check for local development / offline resilience
      if (cleanEmail.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() && cleanPass === DEFAULT_ADMIN_PASSWORD) {
        const userSession = {
          email: cleanEmail,
          name: 'SuperAdmin',
          role: 'admin',
          id: 1,
          loginTime: Date.now()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
        setAdminUser(userSession);
        return { success: true };
      }

      return {
        success: false,
        message: networkError.response?.data?.message || 'Unable to connect to authentication server. Please check your connection.'
      };
    }
  };

  const updateAuthUser = (updatedFields) => {
    setAdminUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to sync updated auth session to storage:', e);
      }
      return updated;
    });
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
    <AuthContext.Provider value={{ adminUser, isAuthenticated, login, logout, updateAuthUser }}>
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
