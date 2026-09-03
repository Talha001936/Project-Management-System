// Note: This file defines a Navbar component that displays navigation links based on the user's role.
import { AppBar, Toolbar, Typography, Button, Chip, Box, Stack, Tooltip } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";
import { 
  Dashboard as DashboardIcon, 
  FolderOpen as ProjectsIcon, 
  Assignment as TasksIcon, 
  People as TeamsIcon, 
  Person as UsersIcon, 
  Logout as LogoutIcon,
} from "@mui/icons-material";
import ConfirmationDialog from "./common/ConfirmationDialog.jsx";

const getNavLinks = (role) => {
  const basePath = `/${role}`;
  
  const links = [
    { to: `${basePath}/dashboard`, label: "Dashboard", icon: DashboardIcon },
    { to: `${basePath}/projects`, label: "Projects", icon: ProjectsIcon },
    { to: `${basePath}/tasks`, label: "Tasks", icon: TasksIcon },
  ];
  
  if (role === 'admin' || role === 'manager') {
    links.push({ to: `${basePath}/teams`, label: "Teams", icon: TeamsIcon });
  }
  
  if (role === 'admin') {
    links.push({ to: `${basePath}/users`, label: "Users", icon: UsersIcon });
  }
  
  return links;
};

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user || loading) {
    return null;
  }

  const authPages = ['/login', '/register', '/unauthorized'];
  if (authPages.includes(location.pathname)) {
    return null;
  }

  const navLinks = getNavLinks(user.role);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const getLastLoginDisplay = () => {
    if (!user.lastLogin) return 'First login';
    const date = new Date(user.lastLogin);
    return `Last login: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ bgcolor: "#121212" }}>
        <Toolbar sx={{ gap: 2, py: 1, flexWrap: "wrap" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#6c63ff",
              letterSpacing: "-0.5px",
              mr: 2,
              cursor: "pointer",
            }}
            onClick={() => navigate(`/${user.role}/dashboard`)}
          >
            PMS
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1 }}>
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = isActivePath(to);
              return (
                <Button
                  key={to}
                  component={Link}
                  to={to}
                  startIcon={<Icon />}
                  sx={{
                    color: isActive ? "#e8e8e8" : "#888888",
                    backgroundColor: isActive ? "#1a1a1a" : "transparent",
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    fontWeight: isActive ? 600 : 400,
                    border: isActive ? "1px solid #2a2a2a" : "none",
                    "&:hover": { backgroundColor: "#1a1a1a", color: "#e8e8e8" },
                    textTransform: "none",
                    fontSize: "0.9rem",
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Stack>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tooltip title={getLastLoginDisplay()} arrow>
              <Chip
                label={user.role}
                size="small"
                sx={{
                  bgcolor: "#1a1a1a",
                  color: "#6c63ff",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  border: "1px solid #2a2a2a",
                  cursor: "pointer",
                }}
              />
            </Tooltip>
            <Button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoggingOut}
              startIcon={<LogoutIcon />}
              sx={{
                color: "#888888",
                "&:hover": {
                  color: "#d45454",
                  backgroundColor: "rgba(212,84,84,0.08)",
                },
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <ConfirmationDialog
        open={showLogoutConfirm}
        title="Logout?"
        message="Are you sure you want to logout? You will need to login again to access your account."
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Logout"
        cancelText="Cancel"
        confirmColor="error"
        loading={isLoggingOut}
      />
    </>
  );
}