// Note: This file is a React component that renders the registration page for new users.
import { useState, useEffect } from "react";
import { 
  Box, Paper, TextField, Button, Typography, Link as MLink, Divider,
  IconButton, InputAdornment 
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";

export default function Register() {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { form, handleChange } = useForm({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      navigate("/login", { 
        replace: true, 
        state: { message: "Registration successful! Please login." } 
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
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

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            margin="normal"
            required
            value={form.name}
            onChange={handleChange("name")}
            placeholder="John Doe"
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#2a2a2a" },
                "&:hover fieldset": { borderColor: "#6c63ff" },
                "&.Mui-focused fieldset": { borderColor: "#6c63ff" },
              },
              "& .MuiInputLabel-root": { color: "#888888" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" },
              "& .MuiOutlinedInput-input": { color: "#e8e8e8" },
            }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            required
            value={form.email}
            onChange={handleChange("email")}
            placeholder="abc@pms.com"
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#2a2a2a" },
                "&:hover fieldset": { borderColor: "#6c63ff" },
                "&.Mui-focused fieldset": { borderColor: "#6c63ff" },
              },
              "& .MuiInputLabel-root": { color: "#888888" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" },
              "& .MuiOutlinedInput-input": { color: "#e8e8e8" },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            margin="normal"
            required
            value={form.password}
            onChange={handleChange("password")}
            helperText="Must be at least 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    edge="end"
                    sx={{ color: "#888888" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#2a2a2a" },
                "&:hover fieldset": { borderColor: "#6c63ff" },
                "&.Mui-focused fieldset": { borderColor: "#6c63ff" },
              },
              "& .MuiInputLabel-root": { color: "#888888" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" },
              "& .MuiOutlinedInput-input": { color: "#e8e8e8" },
              "& .MuiFormHelperText-root": { color: "#666666" },
            }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading || authLoading}
            sx={{ 
              mt: 3, 
              mb: 2, 
              py: 1.5, 
              borderRadius: 2, 
              fontWeight: 600,
              backgroundColor: "#6c63ff",
              "&:hover": { backgroundColor: "#5a52e8" },
              "&.Mui-disabled": { backgroundColor: "#3a3a3a", color: "#666666" }
            }}
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