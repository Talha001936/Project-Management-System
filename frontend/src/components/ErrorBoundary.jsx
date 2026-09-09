import { Component } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, Paper } from '@mui/material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh',
            p: 3,
          }}
        >
          <Paper
            sx={{
              p: 5,
              maxWidth: 500,
              width: '100%',
              textAlign: 'center',
              borderRadius: 3,
              border: '1px solid #2a2a2a',
              backgroundColor: '#1a1a1a',
            }}
            elevation={0}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#d45454' }}>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={this.handleReload}
                sx={{
                  backgroundColor: '#6c63ff',
                  '&:hover': { backgroundColor: '#5a52e8' },
                }}
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleGoHome}
                sx={{
                  color: '#888888',
                  borderColor: '#2a2a2a',
                  '&:hover': {
                    borderColor: '#6c63ff',
                    color: '#6c63ff',
                  },
                }}
              >
                Go Home
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
