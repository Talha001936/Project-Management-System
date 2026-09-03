// Note: This file is a React component that renders the Unauthorized Access page, informing users 
// that they do not have permission to view the requested page.
import { Box, Typography, Button, Paper, Chip } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LockIcon from '@mui/icons-material/Lock';

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin": return "/admin/dashboard";
      case "manager": return "/manager/dashboard";
      case "employee": return "/employee/dashboard";
      default: return "/dashboard";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh",
      }}
    >
      <Paper
        sx={{
          p: 5,
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
          borderRadius: 3,
          border: "1px solid #2a2a2a",
          backgroundColor: "#1a1a1a",
        }}
        elevation={0}
      >
        <Box
          sx={{
            fontSize: 80,
            mb: 2,
            color: "#d45454",
          }}
        >
          <LockIcon fontSize="inherit" />
        </Box>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{ color: "#e8e8e8" }}
        >
          403 — Unauthorized Access
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          You don't have permission to view this page.
        </Typography>
        {user && (
          <Box sx={{ my: 2 }}>
            <Chip
              label={`Your Role: ${user.role.toUpperCase()}`}
              sx={{
                backgroundColor: "rgba(108,99,255,0.12)",
                color: "#6c63ff",
                border: "1px solid rgba(108,99,255,0.25)",
                fontWeight: 600,
              }}
            />
          </Box>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, color: "#666666" }}
        >
          {user ? (
            <>
              This page requires different permissions than your current role.
         
            </>
          ) : (
            "Please login to access this page."
          )}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            component={Link}
            to={getDashboardPath()}
            variant="contained"
            sx={{
              backgroundColor: "#6c63ff",
              "&:hover": { backgroundColor: "#5a52e8" },
            }}
          >
            {user ? "Go to Dashboard" : "Go to Login"}
          </Button>
          {user && (
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{
                color: "#888888",
                borderColor: "#2a2a2a",
                "&:hover": {
                  borderColor: "#6c63ff",
                  color: "#6c63ff",
                },
              }}
            >
              Go Back
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}