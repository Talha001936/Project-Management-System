import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Container } from "@mui/material";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
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

function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  const hideNavbar = !user || loading || 
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

function getRoleDashboardPath() {
  const user = JSON.parse(localStorage.getItem('pms_user') || sessionStorage.getItem('pms_user') || '{}');
  const role = user?.role || 'employee';
  return `/${role}/dashboard`;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Container sx={{ py: 4 }}><Login /></Container>} />
      <Route path="/register" element={<Container sx={{ py: 4 }}><Register /></Container>} />
      <Route path="/unauthorized" element={<Container sx={{ py: 4 }}><Unauthorized /></Container>} />

      <Route element={<ProtectedRoute />}>
       
        <Route element={<RoleRoute roles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/admin/projects" element={<AppLayout><Projects /></AppLayout>} />
          <Route path="/admin/tasks" element={<AppLayout><Tasks /></AppLayout>} />
          <Route path="/admin/teams" element={<AppLayout><Teams /></AppLayout>} />
          <Route path="/admin/users" element={<AppLayout><Users /></AppLayout>} />
        </Route>

        <Route element={<RoleRoute roles={["manager"]} />}>
          <Route path="/manager/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/manager/projects" element={<AppLayout><Projects /></AppLayout>} />
          <Route path="/manager/tasks" element={<AppLayout><Tasks /></AppLayout>} />
          <Route path="/manager/teams" element={<AppLayout><Teams /></AppLayout>} />
        </Route>

        <Route element={<RoleRoute roles={["employee"]} />}>
          <Route path="/employee/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/employee/projects" element={<AppLayout><Projects /></AppLayout>} />
          <Route path="/employee/tasks" element={<AppLayout><Tasks /></AppLayout>} />
        </Route>

        <Route path="/dashboard" element={<Navigate to={getRoleDashboardPath()} replace />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}