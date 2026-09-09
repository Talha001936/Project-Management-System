import { AppBar, Toolbar, Typography, Button, Chip, Box, Stack } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState, useEffect } from 'react';
import {
  Dashboard as DashboardIcon,
  FolderOpen as ProjectsIcon,
  Assignment as TasksIcon,
  People as TeamsIcon,
  Person as UsersIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import ConfirmationDialog from './common/ConfirmationDialog.jsx';
import { hasRole } from '../utils/helpers.js';

const getNavLinks = role => {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/projects', label: 'Projects', icon: ProjectsIcon },
    { to: '/tasks', label: 'Tasks', icon: TasksIcon },
  ];

  if (hasRole({ role }, ['admin', 'manager'])) {
    links.push({ to: '/teams', label: 'Teams', icon: TeamsIcon });
  }

  if (role === 'admin') {
    links.push({ to: '/users', label: 'Users', icon: UsersIcon });
  }

  return links;
};

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!user && !loading && !isLoggingOut) {
      const currentPath = location.pathname;
      if (!['/login', '/register', '/unauthorized'].includes(currentPath)) {
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, navigate, location.pathname, isLoggingOut]);

  if (!user || loading) return null;

  const authPages = ['/login', '/register', '/unauthorized'];
  if (authPages.includes(location.pathname)) return null;

  const navLinks = getNavLinks(user.role);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    try {
      await logout();
    } catch (error) {
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#121212' }}>
        <Toolbar sx={{ gap: 2, py: 1, flexWrap: 'wrap' }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#6c63ff', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            PMS
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1 }}>
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Button
                  key={to}
                  component={Link}
                  to={to}
                  startIcon={<Icon />}
                  sx={{
                    color: isActive ? '#e8e8e8' : '#888888',
                    backgroundColor: isActive ? '#1a1a1a' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    fontWeight: isActive ? 600 : 400,
                    border: isActive ? '1px solid #2a2a2a' : 'none',
                    '&:hover': { backgroundColor: '#1a1a1a', color: '#e8e8e8' },
                    textTransform: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={user.role}
              size="small"
              sx={{
                bgcolor: '#1a1a1a',
                color: '#6c63ff',
                fontWeight: 600,
                textTransform: 'capitalize',
                border: '1px solid #2a2a2a',
              }}
            />
            <Button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoggingOut}
              startIcon={<LogoutIcon />}
              sx={{
                color: '#888888',
                '&:hover': { color: '#d45454', backgroundColor: 'rgba(212,84,84,0.08)' },
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <ConfirmationDialog
        open={showLogoutConfirm}
        title="Logout?"
        message="Are you sure you want to logout?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Logout"
        confirmColor="error"
        loading={isLoggingOut}
      />
    </>
  );
}
