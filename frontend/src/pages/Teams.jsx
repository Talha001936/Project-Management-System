import TeamManagement from '../components/teams/TeamManagement.jsx';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';

export default function Teams() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, color: '#e8e8e8' }}>
        Team Management
      </Typography>
      <TeamManagement />
    </Box>
  );
}
