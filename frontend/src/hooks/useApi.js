// Note: This file is a custom React hook that provides a way to execute API calls with automatic 
// token refresh handling.
import { useState, useCallback } from "react";
import { tokenStorage } from "../utils/tokenStorage.js";
import { isTokenExpired } from "../utils/permissions.js";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const execute = useCallback(async (apiCall, onSuccess, onError) => {
    setLoading(true);
    setError("");
    try {
      const token = tokenStorage.getToken();
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (!token || !refreshToken) {
        throw new Error('No authentication token found');
      }
      
      if (isTokenExpired(token)) {
        try {
          const refreshResponse = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: refreshToken })
          });
          
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            if (data.token) {
              tokenStorage.setToken(data.token);
              if (data.refreshToken) {
                tokenStorage.setRefreshToken(data.refreshToken);
              }
            }
          } else {
            throw new Error('Session expired. Please login again.');
          }
        } catch (refreshError) {
          tokenStorage.clear();
          throw new Error('Session expired. Please login again.');
        }
      }
      
      const result = await apiCall();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Operation failed";
      setError(message);
      
      if (err.response?.status === 401 || message === 'Session expired. Please login again.') {
        tokenStorage.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
      }
      
      if (onError) onError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, execute };
}