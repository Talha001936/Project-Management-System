// Note: This file is responsible for managing the authentication state of the application. 
// It provides context for user authentication, including login, logout, registration, and 
// session management. It also handles token validation and refreshing, as well as clearing 
// cached data on logout or session expiry.
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";
import { tokenStorage } from "../utils/tokenStorage.js";
import { isTokenExpired } from "../utils/permissions.js";
import { useToast } from "../hooks/useToast.jsx";


let globalClearCache = null;

export const setGlobalClearCache = (fn) => {
  globalClearCache = fn;
};

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const { showSuccess, showError, showInfo } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const validate = async () => {
      const token = tokenStorage.getToken();
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (!token || !refreshToken) { 
        tokenStorage.clear();
        setLoading(false); 
        setAuthChecked(true); 
        return; 
      }

      if (isTokenExpired(token)) {
        try {
          const response = await api.post('/auth/refresh-token', {
            refreshToken: refreshToken
          });
          
          if (response.data.token) {
            tokenStorage.setToken(response.data.token);
            if (response.data.refreshToken) {
              tokenStorage.setRefreshToken(response.data.refreshToken);
            }
          } else {
            tokenStorage.clear();
            setLoading(false);
            setAuthChecked(true);
            return;
          }
        } catch (error) {
          tokenStorage.clear();
          setLoading(false);
          setAuthChecked(true);
          return;
        }
      }

      try {
        const response = await api.get("/auth/me");
        if (response?.data?.user) {
          setUser(response.data.user);
        } else {
          tokenStorage.clear();
          setUser(null);
        }
      } catch (error) {
        tokenStorage.clear();
        setUser(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
    };
    
    validate();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      
      if (response?.data?.token && response?.data?.user) {
        tokenStorage.setSession(
          response.data.token, 
          response.data.refreshToken, 
          response.data.user, 
          rememberMe
        );
        setUser(response.data.user);
        showSuccess(`Welcome back, ${response.data.user.name}!`, 'Success');
        return response.data;
      }
      throw new Error('Invalid login response');
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed. Please try again.', 'Login Failed');
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post("/auth/register", { name, email, password });
      showSuccess('Registration successful! Please login.', 'Success');
      return response.data;
    } catch (error) {
      showError(error.response?.data?.message || 'Registration failed. Please try again.', 'Registration Failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = tokenStorage.getToken();
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (token) {
        await api.post("/auth/logout", { 
          refreshToken: refreshToken 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Note: Clear all cached data on logout
      if (globalClearCache) {
        globalClearCache();
      }
      
      showSuccess('Logged out successfully', 'Success');
    } catch (error) {
      
      showInfo('Session cleared', 'Info');
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  };

  const refreshSession = async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await api.post('/auth/refresh-token', {
        refreshToken: refreshToken
      });

      if (response.data.token) {
        tokenStorage.setToken(response.data.token);
        if (response.data.refreshToken) {
          tokenStorage.setRefreshToken(response.data.refreshToken);
        }
        return response.data;
      }
      throw new Error('Failed to refresh token');
    } catch (error) {
      tokenStorage.clear();
      setUser(null);
      // Note : Clear cache on session expiry
      if (globalClearCache) {
        globalClearCache();
      }
      showError('Session expired. Please login again.', 'Session Expired');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      authChecked, 
      login, 
      register, 
      logout,
      refreshSession,
      isAuthenticated: !!user && !!tokenStorage.getToken()
    }}>
      {children}
    </AuthContext.Provider>
  );
}