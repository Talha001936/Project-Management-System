// Note: This file is used to handle user login. It provides a form for users 
// to enter their email and password, manages form state, handles authentication, 
// and redirects users based on their roles after successful login.
import { useState, useEffect } from "react";
import { Box, Paper, TextField, Button, Typography, Alert, Link as MLink, Divider } from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { form, handleChange } = useForm({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      const from = location.state?.from || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      // Navigation will happen in useEffect
    } catch (err) {
      console.error("Login error details:", err);
      const message = err.response?.data?.message || err.message || "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: 380,
          borderRadius: 3,
          border: "1px solid #2a2a2a",
          backgroundColor: "#1a1a1a",
        }}
        elevation={0}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={1}
          sx={{ color: "#e8e8e8" }}
        >
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Sign in to continue to your dashboard
        </Typography>
        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              borderRadius: 2,
              backgroundColor: "rgba(74,158,74,0.12)",
              color: "#4a9e4a",
            }}
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              backgroundColor: "rgba(212,84,84,0.12)",
              color: "#d45454",
            }}
          >
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            required
            value={form.email}
            onChange={handleChange("email")}
            placeholder="admin@pms.com"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            required
            value={form.password}
            onChange={handleChange("password")}
            placeholder="password123"
            helperText="Default password for all demo users: password123"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading || authLoading}
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, fontWeight: 600 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <Divider sx={{ my: 2, borderColor: "#2a2a2a" }}>
          <Typography variant="caption" color="text.secondary">
            New here?
          </Typography>
        </Divider>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <MLink
              component={Link}
              to="/register"
              sx={{
                fontWeight: 600,
                textDecoration: "none",
                color: "#6c63ff",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Create Account
            </MLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}