//Note:It checks if the user is authenticated and has the required role to access a specific route. 
// If the user is not authenticated or does not have the required role, they are redirected 
// to the login page or an unauthorized page.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isTokenExpired, clearSession } from "../utils/permissions.js";
import { tokenStorage } from "../utils/tokenStorage.js";

export default function RoleRoute({ roles, redirectTo = "/unauthorized" }) {
  const { user, loading, refreshSession } = useAuth();
  const location = useLocation();
  
  const token = tokenStorage.getToken();
  const refreshToken = tokenStorage.getRefreshToken();

  if (loading) {
    return null;
  }
  
  if (!token || !refreshToken || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (isTokenExpired(token)) {
    refreshSession().catch(() => {
      clearSession();
      return <Navigate to="/login" state={{ from: location.pathname, session: 'expired' }} replace />;
    });
  }
  
  if (!roles.includes(user.role)) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }
  
  return <Outlet />;
}