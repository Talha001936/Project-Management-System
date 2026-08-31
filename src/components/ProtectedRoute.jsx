// Note: This file is a protected route component for the task application. 
// It checks if the user is authenticated before allowing access to certain routes. 
// If the user is not authenticated, they are redirected to the login page. 
// The component also handles loading states while authentication is being verified.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";


export default function ProtectedRoute() {
  const { user, loading, authChecked } = useAuth();
  const location = useLocation();


  if (loading || !authChecked) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
  
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}