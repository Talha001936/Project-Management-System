
import TeamManagement from "../components/teams/TeamManagement.jsx";
import { Box, Typography } from "@mui/material";

export default function Teams() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, color: "#e8e8e8" }}>
        Team Management
      </Typography>
      <TeamManagement />
    </Box>
  );
}