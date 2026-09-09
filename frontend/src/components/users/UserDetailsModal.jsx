import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { getRoleConfig } from '../../utils/helpers.js';

export default function UserDetailsModal({ user, open, onClose }) {
  if (!user) return null;

  const roleStyle = getRoleConfig(user.role);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          borderRadius: 3,
          border: '1px solid #2a2a2a',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid #2a2a2a', pb: 2, color: '#e8e8e8' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(108,99,255,0.15)',
              color: '#6c63ff',
              width: 48,
              height: 48,
              border: '1px solid rgba(108,99,255,0.2)',
            }}
          >
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: '#e8e8e8', fontWeight: 600 }}>
              {user.name}
            </Typography>
            <Chip
              label={user.role.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: roleStyle.bgColor,
                color: roleStyle.color,
                border: roleStyle.borderColor,
                fontWeight: 600,
                fontSize: '0.65rem',
                borderRadius: '4px',
                mt: 0.5,
              }}
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#2a2a2a', pt: 3, backgroundColor: '#1a1a1a' }}>
        <Stack spacing={2.5}>
          {[
            { label: 'Email Address', value: user.email },
            {
              label: 'Role',
              value: (
                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    backgroundColor: roleStyle.bgColor,
                    color: roleStyle.color,
                    border: roleStyle.borderColor,
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    borderRadius: '6px',
                  }}
                />
              ),
            },
            {
              label: 'Status',
              value: (
                <Chip
                  size="small"
                  label={user.active ? 'Active' : 'Inactive'}
                  sx={{
                    backgroundColor: user.active
                      ? 'rgba(74,158,74,0.12)'
                      : 'rgba(102,102,102,0.12)',
                    color: user.active ? '#4a9e4a' : '#666666',
                    border: user.active
                      ? '1px solid rgba(74,158,74,0.25)'
                      : '1px solid rgba(102,102,102,0.2)',
                    fontWeight: 500,
                    borderRadius: '6px',
                  }}
                />
              ),
            },
          ].map((item, idx) => (
            <Box key={idx}>
              <Typography
                variant="caption"
                sx={{
                  color: '#666666',
                  fontWeight: 500,
                  display: 'block',
                  mb: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.7rem',
                }}
              >
                {item.label}
              </Typography>
              {typeof item.value === 'string' ? (
                <Typography variant="body2" sx={{ color: '#e8e8e8' }}>
                  {item.value}
                </Typography>
              ) : (
                item.value
              )}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #2a2a2a', pt: 2, pb: 2, px: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: '#6c63ff',
            '&:hover': { backgroundColor: '#5a52e8' },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

