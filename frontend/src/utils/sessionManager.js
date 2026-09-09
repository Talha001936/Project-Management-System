//Note : Handles user logout, clears all session data, and redirects to login page when needed.
import { tokenStorage } from './tokenStorage.js';

class SessionManager {
  constructor() {
    this.callbacks = [];
    this.isClearing = false;
    this.initialized = false;
    this.isIntentionalLogout = false;
    this._isLoggingOut = false;
  }

  registerCallback(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  async logout(api = null, showToast = null, navigate = null) {
    if (this.isClearing || this._isLoggingOut) return;
    this._isLoggingOut = true;
    this.isClearing = true;

    try {
      if (showToast) {
        showToast('Logged out successfully.');
      }

      if (api) {
        try {
          await api.post('/auth/logout', {}, { _skipRefresh: true });
        } catch (_error) {}
      }

      this.clearAllSessionData();

      this.callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {}
      });

      if (navigate) {
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 50);
      } else {
        window.location.replace('/login');
      }
    } finally {
      setTimeout(() => {
        this.isClearing = false;
        this._isLoggingOut = false;
      }, 100);
    }
  }

  clearAllSessionData() {
    try {
      sessionStorage.clear();

      if (window.clearAllCache) {
        window.clearAllCache();
      }
      if (window.__clearCache) {
        window.__clearCache();
      }

      tokenStorage.clear();
    } catch (e) {}
  }

  clearSession(redirect = true, isLogout = false) {
    if (this.isClearing || this._isLoggingOut) return;
    this.isClearing = true;

    try {
      this.clearAllSessionData();

      if (redirect) {
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes('/login') &&
          !currentPath.includes('/register') &&
          !currentPath.includes('/unauthorized')
        ) {
          const redirectUrl = isLogout ? '/login' : '/login?session=expired';
          window.location.replace(redirectUrl);
        }
      }
    } finally {
      this.isClearing = false;
    }
  }

  isSessionExpired() {
    try {
      const logoutFlag = sessionStorage.getItem('pms_intentional_logout');
      if (logoutFlag === 'true') {
        sessionStorage.removeItem('pms_intentional_logout');
        this.isIntentionalLogout = false;
        return false;
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  clearLogoutFlag() {
    try {
      sessionStorage.removeItem('pms_intentional_logout');
      this.isIntentionalLogout = false;
    } catch (e) {}
  }

  initializeStorageCleanup() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    try {
      const hasVisited = sessionStorage.getItem('pms_visited');

      if (!hasVisited) {
        sessionStorage.clear();
        sessionStorage.setItem('pms_visited', 'true');
        sessionStorage.setItem('pms_session_start', Date.now().toString());
      } else {
        const sessionStart = sessionStorage.getItem('pms_session_start');
        if (sessionStart) {
          const elapsed = Date.now() - parseInt(sessionStart);
          const maxAge = 24 * 60 * 60 * 1000;
          if (elapsed > maxAge) {
            sessionStorage.clear();
            sessionStorage.setItem('pms_visited', 'true');
            sessionStorage.setItem('pms_session_start', Date.now().toString());
          }
        }
      }
    } catch (e) {}
  }
}

export const sessionManager = new SessionManager();

if (typeof window !== 'undefined') {
  window.clearAllSessionStorage = () => {
    sessionManager.clearSession(true, true);
  };
}
