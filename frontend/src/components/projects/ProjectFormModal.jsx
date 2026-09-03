// Note: This file defines a ProjectFormModal component that provides a modal form for creating or editing projects.
import { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import { useForm } from "../../hooks/useForm.js";
import { useApi } from "../../hooks/useApi.js";
import BaseModal from "../common/BaseModal.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";

import { tokenStorage } from "../../utils/tokenStorage.js";
import { hasValidSession } from "../../utils/permissions.js";
import { useToast } from "../../hooks/useToast.jsx";

const INITIAL = {
  name: "",
  description: "",
  teamIds: [],
  individualMembers: [],
  managerId: "",
};

const getUserName = (id, users) => {
  if (!id) return "Unassigned";
  const user = users?.find((u) => Number(u.id) === Number(id));
  return user?.name || `User #${id}`;
};

const getTeamName = (id, teams) => {
  if (!id) return "No team";
  const team = teams?.find((t) => Number(t.id) === Number(id));
  return team?.name || `Team #${id}`;
};

export default function ProjectFormModal({
  open,
  onClose,
  onSuccess,
  users,
  teams,
  editingProject,
}) {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const { loading, error, setError, execute } = useApi();
  const { form, setForm, handleChange, handleMultiSelectChange, resetForm } = useForm(INITIAL);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [available, setAvailable] = useState({
    users: [],
    managers: [],
    teams: [],
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
      setForm(
        editingProject
          ? {
              name: editingProject.name || "",
              description: editingProject.description || "",
              teamIds: editingProject.teamIds || [],
              individualMembers: editingProject.individualMembers || [],
              managerId: editingProject.managerId || "",
            }
          : INITIAL,
      );
      
      setShowCloseConfirm(false);
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setError("");
    }
  }, [editingProject, open]);

  useEffect(() => {
    if (!users.length || !teams.length) return;

    let filteredUsers = [],
      filteredTeams = [];
    const isAdmin = user.role === "admin";
    const isManager = user.role === "manager";

    if (isAdmin) {
      filteredUsers = users.filter((u) => u.role !== "admin" && u.active);
      filteredTeams = teams;
    } else if (isManager) {
      const managerTeamIds = teams
        .filter((t) => t.leaderId === user.id)
        .map((t) => t.id);
      const memberIds = new Set([user.id]);
      teams
        .filter((t) => managerTeamIds.includes(t.id))
        .forEach((t) => t.members?.forEach((id) => memberIds.add(Number(id))));
      filteredUsers = users.filter(
        (u) => memberIds.has(Number(u.id)) && u.active && u.role !== "admin",
      );
      filteredTeams = teams.filter((t) => t.leaderId === user.id);
    } else {
      filteredUsers = users.filter((u) => Number(u.id) === user.id && u.active);
      filteredTeams = [];
    }

    const managers = isAdmin
      ? users.filter(
          (u) => (u.role === "admin" || u.role === "manager") && u.active,
        )
      : isManager
        ? users.filter((u) => Number(u.id) === user.id && u.active)
        : [];

    setAvailable({ users: filteredUsers, managers, teams: filteredTeams });
  }, [users, teams, user]);

  useEffect(() => {
    if (!form.teamIds?.length || !teams.length) return;
    const leaderIds = new Set();
    form.teamIds.forEach((id) => {
      const team = teams.find((t) => Number(t.id) === Number(id));
      if (team?.leaderId) leaderIds.add(Number(team.leaderId));
    });
    const current = new Set(form.individualMembers.map(Number));
    leaderIds.forEach((id) => current.add(id));
    const newMembers = Array.from(current);
    if (
      JSON.stringify(newMembers.sort()) !==
      JSON.stringify(form.individualMembers.sort())
    ) {
      setForm((prev) => ({ ...prev, individualMembers: newMembers }));
    }
  }, [form.teamIds, teams]);

  const handleSubmit = () => {
    if (!validateSession()) return;
    
    if (!form.name || !form.managerId) {
      setError("Please fill in all required fields");
      showError("Please fill in all required fields");
      return;
    }

    if (editingProject) {
      const hasChanges =
        form.name !== editingProject.name ||
        form.description !== editingProject.description ||
        JSON.stringify(form.teamIds) !==
          JSON.stringify(editingProject.teamIds || []) ||
        JSON.stringify(form.individualMembers) !==
          JSON.stringify(editingProject.individualMembers || []) ||
        Number(form.managerId) !== Number(editingProject.managerId);
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

  const performSubmit = async () => {
    if (!validateSession()) return;
    
    setIsSubmitting(true);
    const data = {
      ...form,
      createdBy: user.id,
      status: editingProject?.status || "active",
    };
    const call = editingProject
      ? () => api.put(`/projects/${editingProject.id}`, data)
      : () => api.post("/projects", data);
    
    try {
      await execute(call);
      // showSuccess(editingProject ? "Project updated successfully" : "Project created successfully");
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setIsSubmitting(false);
      resetForm();
      onSuccess?.();
      handleCloseModal();
    } catch (err) {
      setIsSubmitting(false);
      showError(err?.response?.data?.message || "Failed to save project");
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
    
    const isModified = editingProject
      ? JSON.stringify(form) !==
        JSON.stringify({
          name: editingProject.name || "",
          description: editingProject.description || "",
          teamIds: editingProject.teamIds || [],
          individualMembers: editingProject.individualMembers || [],
          managerId: editingProject.managerId || "",
        })
      : form.name ||
        form.description ||
        form.teamIds.length ||
        form.individualMembers.length ||
        form.managerId;

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
    "& .MuiSelect-icon": { color: "#888888" },
  };
  const menuProps = {
    PaperProps: {
      sx: {
        backgroundColor: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: "8px",
      },
    },
  };
  const menuItemStyle = {
    color: "#e8e8e8",
    "&:hover": { backgroundColor: "rgba(108,99,255,0.08)" },
    "&.Mui-selected": { backgroundColor: "rgba(108,99,255,0.12)" },
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleCloseAttempt}
        title={editingProject ? "Edit Project" : "New Project"}
        actions={
          <button
            type="button"
            className="MuiButton-contained MuiButton-root"
            onClick={handleSubmit}
            disabled={loading || isSubmitting || !form.name || !form.managerId}
            style={{
              padding: "6px 16px",
              background: "#6c63ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                loading || isSubmitting || !form.name || !form.managerId
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading || isSubmitting || !form.name || !form.managerId
                  ? 0.6
                  : 1,
            }}
          >
            {loading || isSubmitting
              ? "Saving..."
              : editingProject
                ? "Update"
                : "Create"}
          </button>
        }
      >
        <TextField
          label="Project Name"
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
          label="Description"
          multiline
          rows={2}
          value={form.description}
          onChange={handleChange("description")}
          fullWidth
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
          <InputLabel sx={{ color: "#888888" }}>Project Manager</InputLabel>
          <Select
            value={form.managerId}
            onChange={(e) => setForm({ ...form, managerId: e.target.value })}
            label="Project Manager"
            sx={selectStyle}
            MenuProps={menuProps}
          >
            {available.managers.map((m) => (
              <MenuItem key={m.id} value={m.id} sx={menuItemStyle}>
                {getUserName(m.id, users)} ({m.role})
              </MenuItem>
            ))}
            {!available.managers.length && (
              <MenuItem disabled sx={{ color: "#666666" }}>
                No managers available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: "#888888" }}>Teams</InputLabel>
          <Select
            multiple
            value={form.teamIds}
            input={<OutlinedInput label="Teams" />}
            onChange={handleMultiSelectChange("teamIds")}
            renderValue={(selected) =>
              selected.map((id) => getTeamName(id, teams)).join(", ")
            }
            sx={selectStyle}
            MenuProps={menuProps}
          >
            {available.teams.map((t) => (
              <MenuItem key={t.id} value={t.id} sx={menuItemStyle}>
                {t.name} ({t.members?.length || 0} members)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={{ color: "#888888" }}>Individual Members</InputLabel>
          <Select
            multiple
            value={form.individualMembers}
            input={<OutlinedInput label="Individual Members" />}
            onChange={handleMultiSelectChange("individualMembers")}
            renderValue={(selected) =>
              selected.map((id) => getUserName(id, users)).join(", ")
            }
            sx={selectStyle}
            MenuProps={menuProps}
          >
            {available.users.map((u) => (
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
        title="Create New Project?"
        message={`Create project?\n\nName: ${form.name}\nManager: ${getUserName(form.managerId, users)}\nTeams: ${form.teamIds.map(id => getTeamName(id, teams)).join(", ")}\nMembers: ${form.individualMembers.map(id => getUserName(id, users)).join(", ")}`}
        onConfirm={performSubmit}
        onCancel={() => setShowCreateConfirm(false)}
        confirmText="Create Project"
        cancelText="Cancel"
        confirmColor="primary"
      />

      <ConfirmationDialog
        open={showUpdateConfirm}
        title="Update Project?"
        message={`Update project?\n\nName: ${form.name}\nManager: ${getUserName(form.managerId, users)}\nTeams: ${form.teamIds.map(id => getTeamName(id, teams)).join(", ")}\nMembers: ${form.individualMembers.map(id => getUserName(id, users)).join(", ")}`}
        onConfirm={performSubmit}
        onCancel={() => setShowUpdateConfirm(false)}
        confirmText="Update Project"
        cancelText="Cancel"
        confirmColor="primary"
      />
    </>
  );
}