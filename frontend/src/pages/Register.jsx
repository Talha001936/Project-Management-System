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
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm.js';
import { useToast } from '../hooks/useToast.jsx';

export default function Register() {
  const { register, user, loading: authLoading } = useAuth();
  const { showSuccess ,showError } = useToast();
  const navigate = useNavigate();
  const { form, handleChange } = useForm({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

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

    if (form.password.length < 8) {
      showError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await register(form.name, form.email, form.password);

      navigate('/login', {
        replace: true,
        state: { message: 'Registration successful! Please login.' },
      });
      showSuccess("Registration successful! Please login")
    } catch (err) {
      setLoading(false);
      showError(err.response?.data?.message || 'Registration failed');
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
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Join the platform
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            margin="normal"
            required
            value={form.name}
            onChange={handleInputChange('name')}
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
            helperText="Must be at least 8 characters"
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
              '& .MuiFormHelperText-root': { color: '#666666' },
            }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              backgroundColor: '#6c63ff',
              '&:hover': { backgroundColor: '#5a52e8' },
              '&.Mui-disabled': { backgroundColor: '#3a3a3a', color: '#666666' },
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, textDecoration: 'none', color: '#6c63ff' }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
