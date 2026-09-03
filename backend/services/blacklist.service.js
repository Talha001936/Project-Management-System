// Note: This service manages a blacklist of invalidated JWT tokens. It allows adding tokens 
// to the blacklist and checking if a token is blacklisted. The blacklist automatically cleans 
// up expired tokens to prevent memory bloat.
import jwt from 'jsonwebtoken';

class TokenBlacklist {
  constructor() {
    this.tokens = new Map();
  }

  add(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const expiryTime = decoded.exp * 1000;
        this.tokens.set(token, expiryTime);
      }
    } catch (error) {
      console.error('Error decoding token for blacklist:', error);
    }
  }

  isBlacklisted(token) {
    this.cleanup();
    return this.tokens.has(token);
  }

  cleanup() {
    const now = Date.now();
    for (const [token, expiry] of this.tokens.entries()) {
      if (expiry < now) {
        this.tokens.delete(token);
      }
    }
  }
}

export const tokenBlacklist = new TokenBlacklist();