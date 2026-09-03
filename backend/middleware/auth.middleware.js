//Note: This middleware is used to authenticate requests by verifying the access token 
// provided in the Authorization header. It checks if the token is valid, not blacklisted, 
// and if the user exists and is active. If any of these checks fail, it responds with an 
// appropriate error message.
import { tokenBlacklist } from '../services/blacklist.service.js';
import { verifyAccessToken } from '../services/token.service.js';
import { getDatabase } from '../services/db.service.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    if (tokenBlacklist.isBlacklisted(token)) {
      return res.status(401).json({ message: 'Token has been invalidated' });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check if user exists and is active
    const db = getDatabase();
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (user.active === false) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};