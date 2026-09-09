//note : Fetches data once, caches it for 5 minutes, and reloads when needed - prevents unnecessary API calls.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi.js';
import { tokenStorage } from '../utils/tokenStorage.js';
import { sessionManager } from '../utils/sessionManager.js';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();
const pendingRequests = new Map();

export function useLoadData(fetchFn, dependencies = [], cacheKey = null) {
  const [data, setData] = useState(null);
  const { loading, error, setError, execute } = useApi();
  const mountedRef = useRef(true);
  const requestIdRef = useRef(null);
  const loadCalledRef = useRef(false);

  const getUserId = useCallback(() => {
    const user = tokenStorage.getUser();
    return user?.id || 'anonymous';
  }, []);

  const getCacheKey = useCallback(() => {
    if (!cacheKey) return null;
    const userId = getUserId();
    return `${userId}_${cacheKey}`;
  }, [cacheKey, getUserId]);

  const clearCache = useCallback(() => {
    const fullCacheKey = getCacheKey();
    if (fullCacheKey) {
      cache.delete(fullCacheKey);
      pendingRequests.delete(fullCacheKey);
    }
  }, [getCacheKey]);

  const load = useCallback(async () => {
    if (sessionManager._isLoggingOut) {
      return;
    }

    if (!mountedRef.current) return;

    const fullCacheKey = getCacheKey();

    if (fullCacheKey && cache.has(fullCacheKey)) {
      const cacheEntry = cache.get(fullCacheKey);
      const isExpired = Date.now() - cacheEntry.timestamp > CACHE_TTL;

      if (!isExpired) {
        setData(cacheEntry.data);
        return;
      }
      cache.delete(fullCacheKey);
    }

    if (fullCacheKey && pendingRequests.has(fullCacheKey)) {
      try {
        const result = await pendingRequests.get(fullCacheKey);
        if (mountedRef.current) {
          setData(result);
          if (fullCacheKey) {
            cache.set(fullCacheKey, { data: result, timestamp: Date.now() });
          }
        }
        return;
      } catch (err) {
        if (err?.response?.status === 403) {
          if (mountedRef.current) {
            setError({ message: 'Permission denied', response: { status: 403 } });
          }
          return;
        }
        if (mountedRef.current) {
          setError(err.message || 'Operation failed');
        }
        return;
      }
    }

    const requestPromise = execute(
      async () => {
        if (sessionManager._isLoggingOut) {
          throw new Error('User logged out');
        }
        const result = await fetchFn();
        return result;
      },
      result => {
        if (mountedRef.current) {
          let responseData = result;
          if (result && typeof result === 'object') {
            if (result.success !== undefined) {
              responseData = result.data || result;
            } else if (result.data) {
              responseData = result.data;
            }
          }
          setData(responseData);
          if (fullCacheKey) {
            cache.set(fullCacheKey, { data: responseData, timestamp: Date.now() });
          }
          if (fullCacheKey) {
            pendingRequests.delete(fullCacheKey);
          }
        }
      },
      err => {
        if (mountedRef.current) {
          if (err?.response?.status === 403) {
            setError({ message: 'Permission denied', response: { status: 403 } });
          } else if (err?.message === 'User logged out') {
            return;
          } else {
            setError(err);
          }
        }
        if (fullCacheKey) {
          pendingRequests.delete(fullCacheKey);
        }
      }
    );

    if (fullCacheKey) {
      pendingRequests.set(fullCacheKey, requestPromise);
    }

    return requestPromise;
  }, [fetchFn, execute, getCacheKey, setError]);

  const reload = useCallback(async () => {
    if (sessionManager._isLoggingOut) return;

    const fullCacheKey = getCacheKey();
    if (fullCacheKey) {
      cache.delete(fullCacheKey);
      pendingRequests.delete(fullCacheKey);
    }
    loadCalledRef.current = false;
    await load();
  }, [load, getCacheKey]);

  useEffect(() => {
    mountedRef.current = true;
    const requestId = Date.now() + Math.random();
    requestIdRef.current = requestId;

    if (!loadCalledRef.current && !sessionManager._isLoggingOut) {
      loadCalledRef.current = true;
      const timer = setTimeout(() => {
        if (
          mountedRef.current &&
          requestIdRef.current === requestId &&
          !sessionManager._isLoggingOut
        ) {
          load();
        }
      }, 50);

      return () => {
        mountedRef.current = false;
        clearTimeout(timer);
        loadCalledRef.current = false;
      };
    }

    return () => {
      mountedRef.current = false;
      loadCalledRef.current = false;
    };
  }, [...dependencies]);

  return {
    data,
    loading,
    error,
    setError,
    reload,
    clearCache,
  };
}

export const clearAllCache = () => {
  cache.clear();
  pendingRequests.clear();
};
