// Note: This component is a modal form for creating a new user. It includes fields for the user's name, 
// email, password, and role.
import { useEffect, useState } from "react";
import { 
  TextField, 
  Select, 
  MenuItem, 
  IconButton, 
  InputAdornment,
  FormControl,
  InputLabel
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm } from "../../hooks/useForm.js";
import { useApi } from "../../hooks/useApi.js";
import BaseModal from "../common/BaseModal.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";
import { useToast } from "../../hooks/useToast.jsx";
import { tokenStorage } from "../../utils/tokenStorage.js";
import { hasValidSession } from "../../utils/permissions.js";

const ROLES = ["manager", "employee"];

export default function UserFormModal({ open, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const { loading, error, setError, execute } = useApi();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { form, handleChange, handleSelectChange, resetForm, setForm } = useForm({
    name: "",
    email: "",
    password: "",
    role: "employee"
  });

  const validateSession = () => {
    if (!hasValidSession()) {
      tokenStorage.clear();
      showError('Your session has expired. Please login again.');
      setTimeout(() => {
        window.location.href = '/login?session=expired';
      }, 500);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", password: "", role: "employee" });
      setShowCloseConfirm(false);
      setShowCreateConfirm(false);
      setError("");
      setShowPassword(false);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!validateSession()) return;
    
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields");
      showError("Please fill in all required fields");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      showError("Password must be at least 8 characters");
      return;
    }

    setShowCreateConfirm(true);
  };

  const performSubmit = async () => {
    if (!validateSession()) return;
    
    setIsSubmitting(true);
    const call = () => api.post("/users", form);
    
    try {
      await execute(call);
      showSuccess("User created successfully");
      setShowCreateConfirm(false);
      setIsSubmitting(false);
      resetForm();
      onSuccess?.();
      handleCloseModal();
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Failed to create user";
      setError(errorMessage);
      showError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    resetForm();
    setShowCloseConfirm(false);
    setShowCreateConfirm(false);
    setShowPassword(false);
    setError("");
    onClose();
  };

  const handleCloseAttempt = () => {
    if (isSubmitting || !open) return;
    
    if (!validateSession()) {
      handleCloseModal();
      return;
    }
    
    const isModified = form.name || form.email || form.password;
    
    if (isModified && !loading) {
      setShowCloseConfirm(true);
    } else {
      handleCloseModal();
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const isValid = () => {
    return form.name && form.email && form.password && form.password.length >= 8;
  };

  const menuItemStyle = { 
    color: "#e8e8e8", 
    '&:hover': { backgroundColor: "rgba(108,99,255,0.08)" }, 
    '&.Mui-selected': { backgroundColor: "rgba(108,99,255,0.12)" } 
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleCloseAttempt}
        title="Create User"
        actions={
          <button
            type="button"
            className="MuiButton-contained MuiButton-root"
            onClick={handleSubmit}
            disabled={loading || isSubmitting || !isValid()}
            style={{
              padding: "6px 16px",
              background: "#6c63ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading || isSubmitting || !isValid() ? "not-allowed" : "pointer",
              opacity: loading || isSubmitting || !isValid() ? 0.6 : 1,
            }}
          >
            {loading || isSubmitting ? "Creating..." : "Create"}
          </button>
        }
      >
        <TextField
          label="Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          required
          sx={{
            mb: 2,
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
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          fullWidth
          required
          sx={{
            mb: 2,
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
          label="Password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={handleChange("password")}
          fullWidth
          required
          helperText="Must be at least 8 characters"
          sx={{
            mb: 2,
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
        />
        
        <FormControl fullWidth>
          <InputLabel sx={{ color: "#888888" }}>Role</InputLabel>
          <Select
            value={form.role}
            onChange={handleSelectChange("role")}
            label="Role"
            sx={{
              backgroundColor: "#0d0d0d",
              borderRadius: 1.5,
              color: "#e8e8e8",
              "& .MuiSelect-icon": { color: "#888888" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a2a2a" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6c63ff" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6c63ff" },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                },
              },
            }}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r} sx={menuItemStyle}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </BaseModal>

      <ConfirmationDialog
        open={showCloseConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to close this form?"
        onConfirm={handleCloseModal}
        onCancel={() => setShowCloseConfirm(false)}
        confirmText="Discard"
        cancelText="Keep Editing"
        confirmColor="error"
      />

      <ConfirmationDialog
        open={showCreateConfirm}
        title="Create New User?"
        message={`Create user?\n\nName: ${form.name}\nEmail: ${form.email}\nRole: ${form.role}`}
        onConfirm={performSubmit}
        onCancel={() => setShowCreateConfirm(false)}
        confirmText="Create User"
        cancelText="Cancel"
        confirmColor="primary"
      />
    </>
  );
}