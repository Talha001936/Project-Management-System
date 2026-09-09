// note this service is used to blacklist access and refresh token
import { getDatabase, saveDatabase } from './db.service.js';
import jwt from 'jsonwebtoken';

class TokenBlacklist {
  constructor() {
    this.tokens = new Map();
    this.loadFromDatabase();
    this.startAutoCleanup();
  }

  startAutoCleanup() {
    setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  loadFromDatabase() {
    try {
      const db = getDatabase();
      if (!db.blacklist) {
        db.blacklist = [];
        saveDatabase();
        return;
      }

      const now = Date.now();
      db.blacklist = db.blacklist.filter(item => {
        let expiryTime;
        if (typeof item.expiresAt === 'string') {
          expiryTime = new Date(item.expiresAt).getTime();
        } else if (typeof item.expiresAt === 'number') {
          expiryTime = item.expiresAt;
        } else {
          return false;
        }

        if (expiryTime > now) {
          this.tokens.set(item.token, expiryTime);
          return true;
        }
        return false;
      });

      if (db.blacklist.length > 0) {
        saveDatabase();
      }
    } catch (error) {}
  }

  add(token) {
    try {
      if (!token) return;

      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return;

      const expiryTime = decoded.exp * 1000;

      if (expiryTime <= Date.now()) return;

      this.tokens.set(token, expiryTime);

      const db = getDatabase();
      if (!db.blacklist) db.blacklist = [];

      const existingIndex = db.blacklist.findIndex(b => b.token === token);
      if (existingIndex === -1) {
        db.blacklist.push({
          token,
          expiresAt: new Date(expiryTime).toISOString(),
        });
        saveDatabase();
      }
    } catch (error) {}
  }

  isBlacklisted(token) {
    if (!token) return false;

    if (this.tokens.has(token)) {
      const expiry = this.tokens.get(token);
      if (expiry > Date.now()) {
        return true;
      } else {
        this.tokens.delete(token);
        return false;
      }
    }

    try {
      const db = getDatabase();
      if (db.blacklist) {
        const entry = db.blacklist.find(b => b.token === token);
        if (entry) {
          let expiryTime;
          if (typeof entry.expiresAt === 'string') {
            expiryTime = new Date(entry.expiresAt).getTime();
          } else if (typeof entry.expiresAt === 'number') {
            expiryTime = entry.expiresAt;
          } else {
            this.removeFromDatabase(token);
            return false;
          }

          if (expiryTime > Date.now()) {
            this.tokens.set(token, expiryTime);
            return true;
          } else {
            this.removeFromDatabase(token);
            return false;
          }
        }
      }
    } catch (error) {}
    return false;
  }

  removeFromDatabase(token) {
    try {
      const db = getDatabase();
      if (db.blacklist) {
        const initialLength = db.blacklist.length;
        db.blacklist = db.blacklist.filter(b => b.token !== token);
        if (db.blacklist.length < initialLength) {
          saveDatabase();
          this.tokens.delete(token);
        }
      }
    } catch (error) {}
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [token, expiry] of this.tokens.entries()) {
      if (expiry < now) {
        this.tokens.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0 || Math.random() < 0.1) {
      try {
        const db = getDatabase();
        if (db.blacklist && db.blacklist.length > 0) {
          const initialLength = db.blacklist.length;
          db.blacklist = db.blacklist.filter(b => {
            let expiryTime;
            if (typeof b.expiresAt === 'string') {
              expiryTime = new Date(b.expiresAt).getTime();
            } else if (typeof b.expiresAt === 'number') {
              expiryTime = b.expiresAt;
            } else {
              return false;
            }
            return expiryTime > now;
          });

          if (db.blacklist.length < initialLength) {
            saveDatabase();
          }
        }
      } catch (error) {}
    }
  }

  getStats() {
    this.cleanup();
    try {
      const db = getDatabase();
      const dbCount = db.blacklist ? db.blacklist.length : 0;
      const memoryCount = this.tokens.size;

      return {
        memoryCount,
        databaseCount: dbCount,
        totalUnique: new Set([...this.tokens.keys()]).size,
      };
    } catch (error) {
      return {
        memoryCount: this.tokens.size,
        databaseCount: 0,
        totalUnique: this.tokens.size,
      };
    }
  }

  forceCleanup() {
    this.cleanup();

    try {
      const db = getDatabase();
      if (db.blacklist) {
        const validTokens = new Set(this.tokens.keys());
        const initialLength = db.blacklist.length;
        db.blacklist = db.blacklist.filter(b => {
          if (!validTokens.has(b.token)) {
            let expiryTime;
            if (typeof b.expiresAt === 'string') {
              expiryTime = new Date(b.expiresAt).getTime();
            } else if (typeof b.expiresAt === 'number') {
              expiryTime = b.expiresAt;
            } else {
              return false;
            }
            return expiryTime > Date.now();
          }
          return true;
        });

        if (db.blacklist.length < initialLength) {
          saveDatabase();
        }
      }
    } catch (error) {}
  }
}

export const tokenBlacklist = new TokenBlacklist();
export const cleanupBlacklist = () => tokenBlacklist.cleanup();
export const getBlacklistStats = () => tokenBlacklist.getStats();
export const forceCleanupBlacklist = () => tokenBlacklist.forceCleanup();
