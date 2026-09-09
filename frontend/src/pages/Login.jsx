import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm.js';
import { useToast } from '../hooks/useToast.jsx';
import { sessionManager } from '../utils/sessionManager.js';

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const { showWarning, showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { form, handleChange } = useForm({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || null;
  const sessionExpired = searchParams.get('session') === 'expired';
  const registrationSuccess = location.state?.message === 'Registration successful! Please login.';

  const isIntentionalLogout = sessionManager.isSessionExpired() === false;

  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    if (!toastShown) {
      if (sessionExpired && !isIntentionalLogout) {
        showWarning('Your session has expired. Please login again.');
        setToastShown(true);
      } else if (registrationSuccess) {
        
        window.history.replaceState({}, document.title);
      }
      sessionManager.clearLogoutFlag();
    }
  }, [
    sessionExpired,
    isIntentionalLogout,
    registrationSuccess,
    showWarning,
    showSuccess,
    toastShown,
  ]);

  useEffect(() => {
    if (user && !authLoading) {
      navigate(from || '/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  useEffect(() => {
    return () => {
      setToastShown(false);
    };
  }, []);

  if (authLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      >
        <CircularProgress sx={{ color: '#6c63ff' }} />
      </Box>
    );
  }

  if (user) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      >
        <CircularProgress sx={{ color: '#6c63ff' }} />
      </Box>
    );
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(form.email, form.password);
      showSuccess('Login successful! Welcome back.');
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 401) {
        showError('Invalid email or password. Please try again.');
      } else if (err.response?.status === 403) {
        showError('Account is deactivated. Please contact admin.');
      } else {
        showError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleInputChange = field => e => {
    handleChange(field)(e);
  };

  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
    >
      <Paper
        sx={{
          p: 4,
          width: 380,
          borderRadius: 3,
          border: '1px solid #2a2a2a',
          backgroundColor: '#1a1a1a',
        }}
        elevation={0}
      >
        <Typography variant="h5" fontWeight={700} mb={1} sx={{ color: '#e8e8e8' }}>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Sign in to continue
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            required
            value={form.email}
            onChange={handleInputChange('email')}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#2a2a2a' },
                '&:hover fieldset': { borderColor: '#6c63ff' },
                '&.Mui-focused fieldset': { borderColor: '#6c63ff' },
              },
              '& .MuiInputLabel-root': { color: '#888888' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#6c63ff' },
              '& .MuiOutlinedInput-input': { color: '#e8e8e8' },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            required
            value={form.password}
            onChange={handleInputChange('password')}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#888888' }}
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#2a2a2a' },
                '&:hover fieldset': { borderColor: '#6c63ff' },
                '&.Mui-focused fieldset': { borderColor: '#6c63ff' },
              },
              '& .MuiInputLabel-root': { color: '#888888' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#6c63ff' },
              '& .MuiOutlinedInput-input': { color: '#e8e8e8' },
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              mt: 2,
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              backgroundColor: '#6c63ff',
              '&:hover': { backgroundColor: '#5a52e8' },
              '&.Mui-disabled': { backgroundColor: '#3a3a3a', color: '#666666' },
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ fontWeight: 600, textDecoration: 'none', color: '#6c63ff' }}
            >
              Create Account
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
