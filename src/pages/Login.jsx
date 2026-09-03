import { useState, useEffect } from "react";
import { 
  Box, Paper, TextField, Button, Typography, Link as MLink, Divider,
  IconButton, InputAdornment
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { tokenStorage } from "../utils/tokenStorage.js";
import { useToast } from "../hooks/useToast.jsx";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const { showWarning } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { form, handleChange } = useForm({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(tokenStorage.isRememberMe());
  
  const sessionExpired = searchParams.get('session') === 'expired';

  useEffect(() => {
    if (user && !authLoading) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (sessionExpired) {
      showWarning('Your session has expired. Please login again.');
    }
  }, [sessionExpired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(form.email, form.password, rememberMe);
      if (result?.user) {
        navigate(`/${result.user.role}/dashboard`, { replace: true });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <Paper sx={{ p: 4, width: 380, borderRadius: 3, border: "1px solid #2a2a2a", backgroundColor: "#1a1a1a" }} elevation={0}>
        <Typography variant="h5" fontWeight={700} mb={1} sx={{ color: "#e8e8e8" }}>Welcome Back</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Sign in to continue to your dashboard</Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" type="email" margin="normal" required
            value={form.email} onChange={handleChange("email")}
            placeholder="abc@pms.com"
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                "& fieldset": { borderColor: "#2a2a2a" }, 
                "&:hover fieldset": { borderColor: "#6c63ff" }, 
                "&.Mui-focused fieldset": { borderColor: "#6c63ff" } 
              }, 
              "& .MuiInputLabel-root": { color: "#888888" }, 
              "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" }, 
              "& .MuiOutlinedInput-input": { color: "#e8e8e8" } 
            }}
          />
          <TextField
            fullWidth label="Password" type={showPassword ? "text" : "password"} margin="normal" required
            value={form.password} onChange={handleChange("password")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: "#888888" }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                "& fieldset": { borderColor: "#2a2a2a" }, 
                "&:hover fieldset": { borderColor: "#6c63ff" }, 
                "&.Mui-focused fieldset": { borderColor: "#6c63ff" } 
              }, 
              "& .MuiInputLabel-root": { color: "#888888" }, 
              "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" }, 
              "& .MuiOutlinedInput-input": { color: "#e8e8e8" } 
            }}
          />

          <Button fullWidth type="submit" variant="contained" disabled={loading || authLoading}
            sx={{ mt: 2, mb: 2, py: 1.5, borderRadius: 2, fontWeight: 600, backgroundColor: "#6c63ff", "&:hover": { backgroundColor: "#5a52e8" }, "&.Mui-disabled": { backgroundColor: "#3a3a3a", color: "#666666" } }}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <Divider sx={{ my: 2, borderColor: "#2a2a2a" }}><Typography variant="caption" color="text.secondary">New here?</Typography></Divider>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <MLink component={Link} to="/register" sx={{ fontWeight: 600, textDecoration: "none", color: "#6c63ff", "&:hover": { textDecoration: "underline" } }}>
              Create Account
            </MLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
