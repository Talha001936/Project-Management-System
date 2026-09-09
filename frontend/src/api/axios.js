// Note: This file is responsible for setting up the Axios instance with interceptors for 
// handling authentication tokens, including refreshing tokens when they expire. It also 
// manages a queue of failed requests while a token refresh is in progress.
import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage.js';
import { sessionManager } from '../utils/sessionManager.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8436/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = token => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = callback => {
  refreshSubscribers.push(callback);
};

api.interceptors.request.use(
  config => {
    const skipRefreshEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh-token',
      '/auth/me',
      '/health',
    ];
    if (skipRefreshEndpoints.some(route => config.url?.includes(route))) {
      config._skipRefresh = true;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (originalRequest._retry || originalRequest._skipRefresh) {
      return Promise.reject(error);
    }

    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh-token'];
    if (authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint))) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(resolve => {
          addRefreshSubscriber(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await api.post(
          '/auth/refresh-token',
          {},
          {
            _skipRefresh: true,
            withCredentials: true,
          }
        );

        if (response.data?.success) {
          isRefreshing = false;
          onRefreshed(null);
          originalRequest._skipRefresh = true;
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        if (tokenStorage.getUser()) {
          sessionManager.clearSession(false);
          if (!window.location.pathname.includes('/login')) {
            window.location.replace('/login?session=expired');
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
