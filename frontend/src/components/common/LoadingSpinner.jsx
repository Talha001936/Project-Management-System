import { Box, CircularProgress } from "@mui/material";

export default function LoadingSpinner({ size = 40, mt = 8 }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt }}>
      <CircularProgress size={size} />
    </Box>
  );
}