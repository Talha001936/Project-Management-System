//Note: This middleware is used to authenticate requests by verifying the access token 
// provided in the Authorization header. It checks if the token is valid, not blacklisted, 
// and if the user exists and is active. If any of these checks fail, it responds with an 
// appropriate error message.
import { tokenBlacklist } from '../services/blacklist.service.js';
import { verifyAccessToken } from '../services/token.service.js';
import { getDatabase } from '../services/db.service.js';
import { unauthorizeResponse } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return unauthorizeResponse(res, 'Authentication required');
    }

    if (tokenBlacklist.isBlacklisted(token)) {
      return unauthorizeResponse(res, 'Token has been invalidated. Please login again.');
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return unauthorizeResponse(res, 'Invalid or expired token');
    }

    const db = getDatabase();
    const user = db.users.find(u => u.id === decoded.id);
    
    if (!user) {
      return unauthorizeResponse(res, 'User not found');
    }
    
    if (user.active === false) {
      return unauthorizeResponse(res, 'Account is deactivated', 403);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    req.accessToken = token;
    
    next();
  } catch (error) {
    console.error('auth error:', error);
    return unauthorizeResponse(res, 'Authentication failed');
  }
};

export const authentication = authenticate;
