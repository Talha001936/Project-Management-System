// Note: This file defines a ProtectedRoute component that checks if the user is authenticated and 
// has a valid session before allowing access to protected routes.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { isTokenExpired, clearSession } from "../utils/permissions.js";
import { tokenStorage } from "../utils/tokenStorage.js";

export default function ProtectedRoute() {
  const { user, loading, authChecked, refreshSession } = useAuth();
  const location = useLocation();

  if (loading || !authChecked) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#6c63ff" }} />
      </Box>
    );
  }

  const token = tokenStorage.getToken();
  const refreshToken = tokenStorage.getRefreshToken();

  if (!token || !refreshToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (isTokenExpired(token)) {
    
    refreshSession().catch(() => {
      clearSession();
      return <Navigate to="/login" state={{ from: location.pathname, session: 'expired' }} replace />;
    });
  }

  if (!user) {
    clearSession();
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}