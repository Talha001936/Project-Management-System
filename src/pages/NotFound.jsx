// Note: This file is a React component that renders a 404 Not Found page.
import { useAuth } from "../context/AuthContext.jsx";

import { useNavigate } from "react-router-dom"; 
import { Box, Button, Paper, Typography } from "@mui/material"; 
import { Link } from "react-router-dom"; 
export default function NotFound() {
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
        
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{ color: "#e8e8e8" }}
        >
          404 — Page Not Found
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            component={Link}
            to={getDashboardPath()}
            variant="contained"
            sx={{
              backgroundColor: "#6c63ff",
              "&:hover": { backgroundColor: "#5a52e8" },
            }}
          >
            Go to Dashboard
          </Button>
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
        </Box>
      </Paper>
    </Box>
  );
}