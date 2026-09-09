import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import { hasRole } from '../utils/permissions.js';

export default function RoleRoute({ roles, redirectTo = '/unauthorized' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress sx={{ color: '#6c63ff' }} />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const hasAccess = hasRole(user, roles);

  if (!hasAccess) {
    console.warn(`Access denied for ${user.role}. Required: ${roles.join(' or ')}`);
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
