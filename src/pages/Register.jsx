//Note : this file is used to register user as an employee.
import { useState, useEffect } from "react";
import { Box, Paper, TextField, Button, Typography, Alert, Link as MLink, Divider } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";

export default function Register() {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { form, handleChange } = useForm({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/login", { replace: true, state: { message: "Registration successful! Please login." } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Join our project management platform
        </Typography>
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
            label="Full Name"
            margin="normal"
            required
            value={form.name}
            onChange={handleChange("name")}
            placeholder="John Doe"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            required
            value={form.email}
            onChange={handleChange("email")}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            required
            value={form.password}
            onChange={handleChange("password")}
            helperText="Must be at least 6 characters"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading || authLoading}
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, fontWeight: 600 }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
        <Divider sx={{ my: 2, borderColor: "#2a2a2a" }}>
          <Typography variant="caption" color="text.secondary">
            Already have an account?
          </Typography>
        </Divider>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2">
            <MLink
              component={Link}
              to="/login"
              sx={{
                fontWeight: 600,
                textDecoration: "none",
                color: "#6c63ff",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Sign In
            </MLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}