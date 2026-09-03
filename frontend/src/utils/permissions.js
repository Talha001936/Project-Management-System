// Note: This file contains utility functions for managing user permissions and session 
// state based on JWT tokens. It provides functions to check if a token is expired, validate 
// the current session, retrieve user information, and determine user permissions based on their role.
import { tokenStorage } from './tokenStorage.js';

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const hasValidSession = () => {
  const token = tokenStorage.getToken();
  const refreshToken = tokenStorage.getRefreshToken();
  if (!token || !refreshToken) return false;
  return !isTokenExpired(token);
};



export const clearSession = () => {
  tokenStorage.clear();
};
