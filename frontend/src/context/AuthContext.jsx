// Note: This file is responsible for managing the authentication state of the application. 
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { tokenStorage } from '../utils/tokenStorage.js';
import { sessionManager } from '../utils/sessionManager.js';
import { useToast } from '../hooks/useToast.jsx';

const AuthContext = createContext(null);

export const setGlobalClearCache = fn => {
  if (typeof window !== 'undefined') {
    window.__clearCache = fn;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const isPublicPath = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path === '/login' || path === '/register' || path === '/unauthorized';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authCheckedRef = useRef(false);
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const verifyUser = useCallback(async () => {
    if (isPublicPath() || sessionManager._isLoggingOut) {
      return false;
    }

    try {
      const response = await api.get('/auth/me', {
        _skipRefresh: true,
        timeout: 5000,
      });

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;
        tokenStorage.setUser(userData);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      if (error.response?.status === 401 && !sessionManager._isLoggingOut) {
        sessionManager.clearSession(false);
        setUser(null);
        return false;
      }
      const storedUser = tokenStorage.getUser();
      if (storedUser && !sessionManager._isLoggingOut) {
        setUser(storedUser);
        return true;
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (authCheckedRef.current || isPublicPath() || sessionManager._isLoggingOut) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const storedUser = tokenStorage.getUser();
        if (storedUser) {
          setUser(storedUser);
        }

        await verifyUser();
      } catch (error) {
        const storedUser = tokenStorage.getUser();
        if (!storedUser || sessionManager._isLoggingOut) {
          setUser(null);
        }
      } finally {
        setLoading(false);
        authCheckedRef.current = true;
      }
    };

    checkAuth();
  }, [verifyUser]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data.user;
        tokenStorage.setUser(userData);
        setUser(userData);
        return { user: userData };
      }
      throw new Error(response.data?.message || 'Invalid login response');
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Registration failed');
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await sessionManager.logout(api, showSuccess, navigate);
    setUser(null);
  }, [showSuccess, navigate]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !sessionManager._isLoggingOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
