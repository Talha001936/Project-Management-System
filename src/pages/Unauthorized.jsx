//Note : this file is used to show unauthorized page when user try to access the page without permission
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>403 — Unauthorized</Typography>
      <Typography color="text.secondary" mb={3}>You don't have permission to view this page.</Typography>
      <Button component={Link} to="/dashboard" variant="contained">Back to Dashboard</Button>
    </Box>
  );
}
