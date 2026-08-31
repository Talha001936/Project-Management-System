// Note: This file is a navigation bar component for the application.
import { AppBar, Toolbar, Typography, Button, Chip, Box, Stack } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { 
  Dashboard as DashboardIcon, 
  FolderOpen as ProjectsIcon, 
  Assignment as TasksIcon, 
  People as TeamsIcon, 
  Person as UsersIcon, 
  Logout as LogoutIcon,
} from "@mui/icons-material";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/projects", label: "Projects", icon: ProjectsIcon },
  { to: "/tasks", label: "Tasks", icon: TasksIcon },
  { to: "/teams", label: "Teams", icon: TeamsIcon, roles: ["admin", "manager"] },
  { to: "/users", label: "Users", icon: UsersIcon, roles: ["admin"] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const visibleLinks = NAV_LINKS.filter(link => !link.roles || link.roles.includes(user.role));

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: 2, py: 1, flexWrap: "wrap" }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#6c63ff",
            letterSpacing: "-0.5px",
            mr: 2,
          }}
        >
          Project Management System
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1 }}>
          {visibleLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
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
          <Chip
            label={user.role}
            size="small"
            sx={{
              bgcolor: "#1a1a1a",
              color: "#6c63ff",
              fontWeight: 600,
              textTransform: "capitalize",
              border: "1px solid #2a2a2a",
            }}
          />
        
          <Button
            onClick={() => {
              logout();
              navigate("/login");
            }}
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
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}