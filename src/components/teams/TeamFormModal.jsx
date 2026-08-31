// sNote: This component is responsible for rendering a modal form for creating or 
// editing a team. It handles form state, validation, API calls, and confirmation 
// dialogs for closing, creating, or updating a team.
import { useEffect, useState } from "react";
import { TextField, Select, MenuItem, FormControl, InputLabel, Alert } from "@mui/material";
import { useForm } from "../../hooks/useForm.js";
import { useApi } from "../../hooks/useApi.js";
import BaseModal from "../common/BaseModal.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";

const INITIAL = { name: "", members: [], leaderId: "" };

export default function TeamFormModal({ open, onClose, onSuccess, editingTeam, users }) {
  const { loading, error, setError, execute } = useApi();
  const { form, setForm, handleChange, handleMultiSelectChange, resetForm } = useForm(INITIAL);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }
  }, [editingTeam, open]);

  const getUserName = (id) => {
    const user = users.find(u => Number(u.id) === Number(id));
    return user ? `${user.name} (${user.role})` : `User #${id}`;
  };

  const performSubmit = async () => {
    setIsSubmitting(true);
    const call = editingTeam 
      ? () => api.put(`/teams/${editingTeam.id}`, form) 
      : () => api.post("/teams", form);
    
    await execute(call, () => { 
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setIsSubmitting(false);
      resetForm(); 
      onSuccess(); 
      handleCloseModal();
    });
    setIsSubmitting(false);
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!form.name || !form.leaderId) {
      setError("Please fill in all required fields");
      return;
    }

    if (editingTeam) {
      const hasChanges = form.name !== editingTeam.name || 
        JSON.stringify(form.members) !== JSON.stringify(editingTeam.members || []) ||
        Number(form.leaderId) !== Number(editingTeam.leaderId);
      
      if (!hasChanges) {
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
    '& .MuiSelect-icon': { color: "#888888" } 
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
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <TextField
          label="Team Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          required
        />
        <FormControl fullWidth required>
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