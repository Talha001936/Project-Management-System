import { useState, useEffect, useCallback, useRef } from "react";
import { useApi } from "./useApi.js";
import { tokenStorage } from "../utils/tokenStorage.js";

const cache = new Map();
const pendingRequests = new Map();

export function useLoadData(fetchFn, dependencies = [], cacheKey = null) {
  const [data, setData] = useState(null);
  const { loading, error, setError, execute } = useApi();
  const mountedRef = useRef(true);
  const requestIdRef = useRef(null);

  const getUserId = () => {
    const user = tokenStorage.getUser();
    return user?.id || 'anonymous';
  };

  const getCacheKey = () => {
    if (!cacheKey) return null;
    const userId = getUserId();
    return `${userId}_${cacheKey}`;
  };

  const clearCache = useCallback(() => {
    const fullCacheKey = getCacheKey();
    if (fullCacheKey) {
      cache.delete(fullCacheKey);
      pendingRequests.delete(fullCacheKey);
    }
  }, [getCacheKey]);

  const load = useCallback(async () => {
    if (!mountedRef.current) return;

    const fullCacheKey = getCacheKey();

    if (fullCacheKey && cache.has(fullCacheKey) && cache.get(fullCacheKey).data) {
      setData(cache.get(fullCacheKey).data);
      return;
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
        if (mountedRef.current) {
          setError(err.message || "Operation failed");
        }
        return;
      }
    }

    const requestPromise = execute(
      fetchFn,
      (result) => {
        if (mountedRef.current) {
          setData(result);
          if (fullCacheKey) {
            cache.set(fullCacheKey, { data: result, timestamp: Date.now() });
          }
          if (fullCacheKey) {
            pendingRequests.delete(fullCacheKey);
          }
        }
      },
      (err) => {
        if (mountedRef.current) {
          setError(err);
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
  }, [fetchFn, execute, cacheKey, getCacheKey]);

  const reload = useCallback(async () => {
    const fullCacheKey = getCacheKey();
    if (fullCacheKey) {
      cache.delete(fullCacheKey);
      pendingRequests.delete(fullCacheKey);
    }
    await load();
  }, [load, getCacheKey]);

  useEffect(() => {
    mountedRef.current = true;
    const requestId = Date.now() + Math.random();
    requestIdRef.current = requestId;

    const timer = setTimeout(() => {
      if (mountedRef.current && requestIdRef.current === requestId) {
        load();
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, dependencies);

  return { data, loading, error, setError, reload, clearCache };
}

export const clearAllCache = () => {
  cache.clear();
  pendingRequests.clear();
};