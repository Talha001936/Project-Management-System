import { Box, Typography, Button } from "@mui/material";

export default function PageHeader({ title, actionLabel, onAction, showAction = true, children }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
      <Typography variant="h5" fontWeight={700}>{title}</Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {children}
        {showAction && actionLabel && (
          <Button variant="contained" onClick={onAction}>{actionLabel}</Button>
        )}
      </Box>
    </Box>
  );
}