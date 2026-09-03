// Note: This middleware is used to authorize requests based on user roles. It 
// checks if the authenticated user has the required role to access a specific 
// route. If the user does not have the required role, it responds with a 403 Forbidden status.
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        yourRole: req.user.role
      });
    }

    next();
  };
};
