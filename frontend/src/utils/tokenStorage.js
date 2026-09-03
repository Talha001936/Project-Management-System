// Note: This file contains a class for managing token storage in the browser's localStorage 
// and sessionStorage.
class TokenStorage {
  constructor() {
    this.tokenKey = 'pms_token';
    this.refreshTokenKey = 'pms_refresh_token';
    this.userKey = 'pms_user';
    this.rememberMeKey = 'pms_remember_me';
  }

  setStorageType(type) {
    if (type === 'local') {
      localStorage.setItem(this.rememberMeKey, 'true');
    } else {
      localStorage.removeItem(this.rememberMeKey);
    }
  }

  getStorage() {
    return localStorage.getItem(this.rememberMeKey) === 'true' ? localStorage : sessionStorage;
  }

  setSession(token, refreshToken, user, rememberMe = false) {
    if (rememberMe) {
      localStorage.setItem(this.rememberMeKey, 'true');
    } else {
      localStorage.removeItem(this.rememberMeKey);
    }

    const storage = this.getStorage();
    storage.setItem(this.tokenKey, token);
    storage.setItem(this.refreshTokenKey, refreshToken);
    storage.setItem(this.userKey, JSON.stringify(user));
  }

  setToken(token) {
    const storage = this.getStorage();
    storage.setItem(this.tokenKey, token);
  }

  setRefreshToken(refreshToken) {
    const storage = this.getStorage();
    storage.setItem(this.refreshTokenKey, refreshToken);
  }

  getToken() {
    let token = sessionStorage.getItem(this.tokenKey);
    if (!token) {
      token = localStorage.getItem(this.tokenKey);
    }
    return token;
  }

  getRefreshToken() {
    let refreshToken = sessionStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      refreshToken = localStorage.getItem(this.refreshTokenKey);
    }
    return refreshToken;
  }

  getUser() {
    try {
      let user = sessionStorage.getItem(this.userKey);
      if (!user) {
        user = localStorage.getItem(this.userKey);
      }
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  clear() {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  isRememberMe() {
    return localStorage.getItem(this.rememberMeKey) === 'true';
  }
}

export const tokenStorage = new TokenStorage();