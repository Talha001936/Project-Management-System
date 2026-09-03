// Note: This middleware is used to enforce role-based access control 
//  in the application. It checks if the authenticated user has one of the
//  required roles to access a specific route. If the user does not have the
//  required role, it responds with a 403 Forbidden status.

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        yourRole: req.user.role
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');