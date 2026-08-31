// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    <>
      <Navbar />
      <Container sx={{ py: 4 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes - all authenticated users can access these */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
            
            {/* Role protected routes */}
            <Route element={<RoleRoute roles={["admin", "manager"]} />}>
              <Route path="/teams" element={<Teams />} />
            </Route>

            <Route element={<RoleRoute roles={["admin"]} />}>
              <Route path="/users" element={<Users />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Container>
    </>
  );
}