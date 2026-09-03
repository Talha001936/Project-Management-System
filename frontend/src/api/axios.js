// Note: This file is responsible for setting up the Axios instance with interceptors for 
// handling authentication tokens, including refreshing tokens when they expire. It also 
// manages a queue of failed requests while a token refresh is in progress.
import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage.js';
import { isTokenExpired } from '../utils/permissions.js';

const api = axios.create({
  baseURL: 'http://localhost:8436/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null, refreshToken = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve({ token, refreshToken });
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    
    const publicRoutes = ['/auth/login', '/auth/register', '/health'];
    if (publicRoutes.some(route => config.url.includes(route))) {
      return config;
    }

    if (token) {
      if (isTokenExpired(token)) {
        tokenStorage.clear();
        return Promise.reject({
          response: {
            status: 401,
            data: { message: 'Token expired' }
          }
        });
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status !== 401 || 
        originalRequest._retry || 
        originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    const token = tokenStorage.getToken();
    
    if (!refreshToken || !token) {
      tokenStorage.clear();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(({ token: newToken }) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const refreshResponse = await api.post('/auth/refresh-token', {
        refreshToken: refreshToken
      });

      const newToken = refreshResponse.data.token;
      const newRefreshToken = refreshResponse.data.refreshToken;
      
      if (newToken) {
        tokenStorage.setToken(newToken);
        if (newRefreshToken) {
          tokenStorage.setRefreshToken(newRefreshToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken, newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      
      throw new Error('No token in refresh response');
    } catch (refreshError) {
      tokenStorage.clear();
      processQueue(refreshError, null);
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;