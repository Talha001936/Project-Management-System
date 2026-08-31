// Note: This component is responsible for rendering a modal form for creating or editing a user.
import { useEffect, useState } from "react";
import { TextField, Select, MenuItem, Alert } from "@mui/material";
import { useForm } from "../../hooks/useForm.js";
import { useApi } from "../../hooks/useApi.js";
import BaseModal from "../common/BaseModal.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";

const ROLES = ["manager", "employee"];

export default function UserFormModal({ open, onClose, onSuccess, editingUser }) {
  const { loading, error, setError, execute } = useApi();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialValues = editingUser ? { name: editingUser.name, email: editingUser.email,
     role: editingUser.role, password: "" } : { name: "", email: "", password: "", role: "employee" };
  const { form, handleChange, handleSelectChange, resetForm, setForm } = useForm(initialValues);

  useEffect(() => {
    if (open) {
      setForm(editingUser ? { name: editingUser.name, email: editingUser.email, 
        role: editingUser.role, password: "" } : { name: "", email: "", password: "", role: "employee" });
      setShowCloseConfirm(false);
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setError("");
    }
  }, [editingUser, open]);

  const handleSubmit = () => {
    if (editingUser) {
      const hasChanges = form.name !== editingUser.name || form.email !== editingUser.email || 
      form.role !== editingUser.role || form.password;
      if (!hasChanges) {
        handleCloseModal();
        return;
      }
      setShowUpdateConfirm(true);
    } else {
      setShowCreateConfirm(true);
    }
  };

  const performSubmit = async () => {
    setIsSubmitting(true);
    const call = editingUser ? () => api.put(`/users/${editingUser.id}`, form) : () => api.post("/users", form);
    await execute(call, () => {
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setIsSubmitting(false);
      resetForm();
      onSuccess?.();
      handleCloseModal();
    });
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowCloseConfirm(false);
    setShowCreateConfirm(false);
    setShowUpdateConfirm(false);
    onClose();
  };

  const handleCloseAttempt = () => {
    if (isSubmitting || !open) return;
    const isModified = editingUser ?
      JSON.stringify(form) !== JSON.stringify({ name: editingUser.name, email: editingUser.email, 
        role: editingUser.role, password: "" }) :
      form.name || form.email || form.password;
    
    if (isModified && !loading) {
      setShowCloseConfirm(true);
    } else {
      handleCloseModal();
    }
  };

  const isValid = () => form.name && form.email && (!editingUser ? form.password 
    && form.password.length >= 6 : true);

  const menuItemStyle = { color: "#e8e8e8", '&:hover': 
    { backgroundColor: "rgba(108,99,255,0.08)" }, '&.Mui-selected':
     { backgroundColor: "rgba(108,99,255,0.12)" } };

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleCloseAttempt}
        title={editingUser ? "Edit User" : "Create User"}
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
              cursor:
                loading || isSubmitting || !isValid()
                  ? "not-allowed"
                  : "pointer",
              opacity: loading || isSubmitting || !isValid() ? 0.6 : 1,
            }}
          >
            {loading || isSubmitting
              ? "Saving..."
              : editingUser
                ? "Update"
                : "Create"}
          </button>
        }
      >
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <TextField
          label="Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        {!editingUser && (
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            fullWidth
            required
            helperText="Must be at least 6 characters"
            sx={{ mb: 2 }}
          />
        )}
        <Select
          value={form.role}
          onChange={handleSelectChange("role")}
          fullWidth
          sx={{
            backgroundColor: "#0d0d0d",
            borderRadius: 1.5,
            color: "#e8e8e8",
            "& .MuiSelect-icon": { color: "#888888" },
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

      <ConfirmationDialog
        open={showUpdateConfirm}
        title="Update User?"
        message={`Update user?\n\nName: ${form.name}\nEmail: ${form.email}\nRole: ${form.role}`}
        onConfirm={performSubmit}
        onCancel={() => setShowUpdateConfirm(false)}
        confirmText="Update User"
        cancelText="Cancel"
        confirmColor="primary"
      />
    </>
  );
}