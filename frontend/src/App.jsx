
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Container, Box, CircularProgress } from "@mui/material";
import PropTypes from 'prop-types';
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Projects from "./pages/Projects.jsx";
import Tasks from "./pages/Tasks.jsx";
import Teams from "./pages/Teams.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import NotFound from "./pages/NotFound.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { sessionManager } from "./utils/sessionManager.js";

function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading && !sessionManager._isLoggingOut) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#6c63ff" }} />
      </Box>
    );
  }
  const hideNavbar = !user || 
    sessionManager._isLoggingOut ||
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    location.pathname === '/unauthorized';
  
  return (
    <>
      {!hideNavbar && <Navbar />}
      <Container sx={{ py: 4 }}>{children}</Container>
    </>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();
  
  const isPublicRoute = location.pathname === '/login' || 
                        location.pathname === '/register' || 
                        location.pathname === '/unauthorized';
  if (loading && !isPublicRoute && !sessionManager._isLoggingOut) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#6c63ff" }} />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Container sx={{ py: 4 }}><Login /></Container>} />
        <Route path="/register" element={<Container sx={{ py: 4 }}><Register /></Container>} />
        <Route path="/unauthorized" element={<Container sx={{ py: 4 }}><Unauthorized /></Container>} />
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={["admin", "manager", "employee"]} />}>
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/projects" element={<AppLayout><Projects /></AppLayout>} />
            <Route path="/tasks" element={<AppLayout><Tasks /></AppLayout>} />
          </Route>
          <Route element={<RoleRoute roles={["admin", "manager"]} />}>
            <Route path="/teams" element={<AppLayout><Teams /></AppLayout>} />
          </Route>
          <Route element={<RoleRoute roles={["admin"]} />}>
            <Route path="/users" element={<AppLayout><Users /></AppLayout>} />
          </Route>
          
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
