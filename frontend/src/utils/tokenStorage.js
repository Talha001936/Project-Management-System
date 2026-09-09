// note :  Saves user info in browser memory so they stay logged in when page refreshes.
class TokenStorage {
  constructor() {
    this.userKey = 'pms_user';
  }

  setUser(user) {
    try {
      sessionStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (e) {}
  }

  getUser() {
    try {
      const user = sessionStorage.getItem(this.userKey);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  getToken() {
    return null;
  }

  getRefreshToken() {
    return null;
  }

  setToken() {}

  setRefreshToken() {}

  hasUser() {
    return !!this.getUser();
  }

  clear() {
    try {
      sessionStorage.removeItem(this.userKey);
    } catch (e) {}
  }

  clearAll() {
    try {
      sessionStorage.clear();
    } catch (e) {}
  }
}

export const tokenStorage = new TokenStorage();
