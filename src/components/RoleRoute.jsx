import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Blocks users whose role isn't in current roles like admin, employee, and manager
export default function RoleRoute({ roles }) {
  const { user } = useAuth();
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
}