// Note: This component is a modal form for creating or editing a team. It includes fields for the team name, 
// team leader, and team members. It also handles form validation, API calls for creating/updating teams, 
// and confirmation dialogs for closing the form or submitting changes.
import { useEffect, useState } from "react";
import { TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useForm } from "../../hooks/useForm.js";
import { useApi } from "../../hooks/useApi.js";
import BaseModal from "../common/BaseModal.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";
import { useToast } from "../../hooks/useToast.jsx";
import { tokenStorage } from "../../utils/tokenStorage.js";
import { hasValidSession } from "../../utils/permissions.js";

const INITIAL = { name: "", members: [], leaderId: "" };

export default function TeamFormModal({ open, onClose, onSuccess, editingTeam, users }) {
  const { showSuccess, showError, showInfo } = useToast();
  const { loading, error, setError, execute } = useApi();
  const { form, setForm, handleChange, handleMultiSelectChange, resetForm } = useForm(INITIAL);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setForm(editingTeam ? { 
        name: editingTeam.name || "", 
        members: editingTeam.members || [], 
        leaderId: editingTeam.leaderId || "" 
      } : INITIAL);
      setShowCloseConfirm(false);
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setError("");
    }
  }, [editingTeam, open]);

  const getUserName = (id) => {
    const user = users.find(u => Number(u.id) === Number(id));
    return user ? `${user.name} (${user.role})` : `User #${id}`;
  };

  const performSubmit = async () => {
    if (!validateSession()) return;
    
    setIsSubmitting(true);
    const call = editingTeam 
      ? () => api.put(`/teams/${editingTeam.id}`, form) 
      : () => api.post("/teams", form);
    
    try {
      await execute(call);
      showSuccess(editingTeam ? "Team updated successfully" : "Team created successfully");
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setIsSubmitting(false);
      resetForm(); 
      onSuccess(); 
      handleCloseModal();
    } catch (err) {
      setIsSubmitting(false);
      showError(err?.response?.data?.message || "Failed to save team");
    }
  };

  const handleSubmit = () => {
    if (!validateSession()) return;
    
    if (!form.name || !form.leaderId) {
      setError("Please fill in all required fields");
      showError("Please fill in all required fields");
      return;
    }

    if (editingTeam) {
      const hasChanges = form.name !== editingTeam.name || 
        JSON.stringify(form.members) !== JSON.stringify(editingTeam.members || []) ||
        Number(form.leaderId) !== Number(editingTeam.leaderId);
      
      if (!hasChanges) {
        showInfo("No changes to save");
        handleCloseModal();
        return;
      }
      setShowUpdateConfirm(true);
    } else {
      setShowCreateConfirm(true);
    }
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
    
    if (!validateSession()) {
      handleCloseModal();
      return;
    }
    
    const isModified = editingTeam ?
      JSON.stringify(form) !== JSON.stringify({ 
        name: editingTeam.name || "", 
        members: editingTeam.members || [], 
        leaderId: editingTeam.leaderId || "" 
      }) :
      form.name || form.members.length || form.leaderId;
    
    if (isModified && !loading) {
      setShowCloseConfirm(true);
    } else {
      handleCloseModal();
    }
  };

  const selectStyle = { 
    backgroundColor: "#0d0d0d", 
    borderRadius: 1.5, 
    color: "#e8e8e8", 
    '& .MuiSelect-icon': { color: "#888888" },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: "#2a2a2a" },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "#6c63ff" },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: "#6c63ff" },
  };
  
  const menuProps = { 
    PaperProps: { 
      sx: { 
        backgroundColor: '#1a1a1a', 
        border: '1px solid #2a2a2a', 
        borderRadius: '8px' 
      } 
    } 
  };
  
  const menuItemStyle = { 
    color: "#e8e8e8", 
    '&:hover': { backgroundColor: "rgba(108,99,255,0.08)" }, 
    '&.Mui-selected': { backgroundColor: "rgba(108,99,255,0.12)" } 
  };

  const getMemberNames = () => {
    if (!form.members.length) return "No members selected";
    return form.members.map(id => getUserName(id)).join(", ");
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleCloseAttempt}
        title={editingTeam ? "Edit Team" : "Create Team"}
        actions={
          <button
            type="button"
            className="MuiButton-contained MuiButton-root"
            onClick={handleSubmit}
            disabled={loading || isSubmitting || !form.name || !form.leaderId}
            style={{
              padding: "6px 16px",
              background: "#6c63ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading || isSubmitting || !form.name || !form.leaderId
                ? "not-allowed"
                : "pointer",
              opacity: loading || isSubmitting || !form.name || !form.leaderId ? 0.6 : 1,
            }}
          >
            {loading || isSubmitting ? "Saving..." : editingTeam ? "Update" : "Create"}
          </button>
        }
      >
        <TextField
          label="Team Name"
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
        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel sx={{ color: "#888888" }}>Team Leader</InputLabel>
          <Select
            value={form.leaderId}
            onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
            label="Team Leader"
            sx={selectStyle}
            MenuProps={menuProps}
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={menuItemStyle}>
                {u.name} ({u.role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel sx={{ color: "#888888" }}>Team Members</InputLabel>
          <Select
            multiple
            value={form.members}
            onChange={handleMultiSelectChange("members")}
            renderValue={(selected) =>
              selected
                .map((id) => {
                  const u = users.find((u) => Number(u.id) === Number(id));
                  return u ? `${u.name} (${u.role})` : `User #${id}`;
                })
                .join(", ")
            }
            label="Team Members"
            sx={selectStyle}
            MenuProps={menuProps}
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={menuItemStyle}>
                {u.name} ({u.role})
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
        title="Create New Team?"
        message={`Are you sure you want to create this team?\n\nTeam Name: ${form.name}\nTeam Leader: ${getUserName(form.leaderId)}\nMembers: ${getMemberNames()}`}
        onConfirm={performSubmit}
        onCancel={() => setShowCreateConfirm(false)}
        confirmText="Create Team"
        cancelText="Cancel"
        confirmColor="primary"
      />

      <ConfirmationDialog
        open={showUpdateConfirm}
        title="Update Team?"
        message={`Are you sure you want to update this team?\n\nTeam Name: ${form.name}\nTeam Leader: ${getUserName(form.leaderId)}\nMembers: ${getMemberNames()}`}
        onConfirm={performSubmit}
        onCancel={() => setShowUpdateConfirm(false)}
        confirmText="Update Team"
        cancelText="Cancel"
        confirmColor="primary"
      />
    </>
  );
}