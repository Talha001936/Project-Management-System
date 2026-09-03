
import { Alert } from "@mui/material";

export default function EmptyState({ message, severity = "info" }) {
  return (
    <Alert 
      severity={severity}
      sx={{
        borderRadius: 2,
        backgroundColor: severity === "info" ? "rgba(108,99,255,0.08)" : undefined,
        color: severity === "info" ? "#6c63ff" : undefined,
        border: severity === "info" ? "1px solid rgba(108,99,255,0.2)" : undefined,
      }}
    >
      {message}
    </Alert>
  );
}