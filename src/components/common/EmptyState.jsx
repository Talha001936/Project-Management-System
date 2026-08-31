import { Alert } from "@mui/material";

export default function EmptyState({ message, severity = "info" }) {
  return <Alert severity={severity}>{message}</Alert>;
}