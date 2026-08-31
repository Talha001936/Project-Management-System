//Note : this file is used to create a custom hook for making API calls. 
// It manages loading and error states, and provides a reusable execute 
// function for API requests.
import { useState, useCallback } from "react";
import api from "../api/axios.js";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const execute = useCallback(async (apiCall, onSuccess, onError) => {
    setLoading(true);
    setError("");
    try {
      const result = await apiCall();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const message =  "Operation failed";
      setError(message);
      if (onError) onError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, execute };
}