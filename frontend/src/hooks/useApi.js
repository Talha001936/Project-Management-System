//note Handles API calls with built-in loading/error states so components don't repeat the same code.
import { useState, useCallback } from 'react';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const execute = useCallback(async (apiCall, onSuccess, onError) => {
    setLoading(true);
    setError('');
    try {
      const result = await apiCall();

      let responseData = result;
      if (result && typeof result === 'object') {
        if (result.success !== undefined) {
          if (result.success === false) {
            throw new Error(result.message || 'Operation failed');
          }
          responseData = result.data || result;
        } else if (result.data) {
          responseData = result.data;
        }
      }
      if (onSuccess) onSuccess(responseData);
      return responseData;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Operation failed';
      setError(message);
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, execute };
}
