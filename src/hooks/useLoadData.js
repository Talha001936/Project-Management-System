//Note: this file is used to create a custom hook for loading data from an API. 
// It uses the useApi hook to manage loading and error states, and provides a 
// reload function to re-fetch the data when needed.
import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi.js";

export function useLoadData(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const { loading, error, setError, execute } = useApi();

  const load = useCallback(async () => {
    await execute(
      fetchFn,
      (result) => setData(result),
      (err) => setError(err)
    );
  }, [fetchFn, execute]);

  useEffect(() => {
    load();
  }, dependencies);

  return { data, loading, error, setError, reload: load };
}