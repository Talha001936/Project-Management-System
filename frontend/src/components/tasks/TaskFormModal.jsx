
import { useEffect, useState, useCallback, useMemo } from "react";
import { TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import { useForm } from "../../hooks/useForm.js";
import { useApi } from "../../hooks/useApi.js";
import BaseModal from "../common/BaseModal.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";
import { useToast } from "../../hooks/useToast.jsx";
import { tokenStorage } from "../../utils/tokenStorage.js";
import { hasValidSession } from "../../utils/permissions.js";
import { getUserName, getProjectName } from "../../utils/helpers.js";

const INITIAL = { 
  title: "", 
  description: "", 
  projectId: "", 
  assigneeId: "", 
  status: "todo", 
  priority: "medium" 
};

const STATUSES = ["todo", "in-progress", "review", "done"];

export default function TaskFormModal({ 
  open, 
  onClose, 
  onSuccess, 
  projects, 
  users, 
  teams, 
  editingTask 
}) {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { loading, error, setError, execute } = useApi();
  const { form, setForm, handleChange, handleSelectChange, resetForm } = useForm(INITIAL);
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
      if (editingTask) {
        setForm({
          title: editingTask.title || "",
          description: editingTask.description || "",
          projectId: editingTask.projectId || "",
          assigneeId: editingTask.assigneeId || "",
          status: editingTask.status || "todo",
          priority: editingTask.priority || "medium"
        });
      } else {
        setForm(INITIAL);
      }
      setShowCloseConfirm(false);
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setError("");
    }
  }, [editingTask, open, setForm, setError]);

  // Filter projects based on user role
  const availableProjects = useMemo(() => {
    if (!projects.length) return [];

    if (user.role === "admin") {
      return projects;
    } else if (user.role === "manager") {
      return projects.filter(p => Number(p.managerId) === Number(user.id));
    }
    return [];
  }, [projects, user]);

  // Reset assignee when project changes
  useEffect(() => {
    if (open && !editingTask && form.projectId) {
      const availableAssignees = users.filter(u => u.active !== false);
      if (availableAssignees.length > 0 && !availableAssignees.some(u => Number(u.id) === Number(form.assigneeId))) {
        setForm(prev => ({ ...prev, assigneeId: availableAssignees[0]?.id || "" }));
      } else if (availableAssignees.length === 0) {
        setForm(prev => ({ ...prev, assigneeId: "" }));
      }
    }
  }, [form.projectId, open, editingTask, users]);

  const handleSubmit = useCallback(() => {
    if (!validateSession()) return;
    
    if (!form.title || !form.projectId || !form.assigneeId) {
      setError("Please fill in all required fields");
      showError("Please fill in all required fields");
      return;
    }

    if (editingTask) {
      const hasChanges = form.title !== editingTask.title || 
        form.description !== editingTask.description ||
        Number(form.projectId) !== Number(editingTask.projectId) || 
        Number(form.assigneeId) !== Number(editingTask.assigneeId) ||
        form.priority !== editingTask.priority ||
        form.status !== editingTask.status;
      
      if (!hasChanges) { 
        showInfo("No changes to save");
        handleCloseModal();
        return; 
      }
      setShowUpdateConfirm(true);
    } else {
      setShowCreateConfirm(true);
    }
  }, [form, editingTask, setError, showError, showInfo]);

  const performSubmit = useCallback(async () => {
    if (!validateSession()) return;
    
    setIsSubmitting(true);
    
    const data = { ...form };
    if (!editingTask) data.status = "todo";
    
    const call = editingTask 
      ? () => api.put(`/tasks/${editingTask.id}`, data) 
      : () => api.post("/tasks", data);
    
    try {
      await execute(call);
      showSuccess(editingTask ? "Task updated successfully" : "Task created successfully");
      setShowCreateConfirm(false);
      setShowUpdateConfirm(false);
      setIsSubmitting(false);
      resetForm();
      if (onSuccess) onSuccess();
      handleCloseModal();
    } catch (err) {
      setIsSubmitting(false);
      const errorMsg = err?.response?.data?.message || "Failed to save task";
      showError(errorMsg);
    }
  }, [form, editingTask, execute, showSuccess, showError, resetForm, onSuccess]);

  const handleCloseModal = useCallback(() => {
    resetForm();
    setShowCloseConfirm(false);
    setShowCreateConfirm(false);
    setShowUpdateConfirm(false);
    onClose();
  }, [resetForm, onClose]);

  const handleCloseAttempt = useCallback(() => {
    if (isSubmitting || !open) return;
    
    if (!validateSession()) {
      handleCloseModal();
      return;
    }
    
    const isModified = editingTask ?
      JSON.stringify(form) !== JSON.stringify({ 
        title: editingTask.title || "", 
        description: editingTask.description || "", 
        projectId: editingTask.projectId || "", 
        assigneeId: editingTask.assigneeId || "", 
        status: editingTask.status || "todo", 
        priority: editingTask.priority || "medium" 
      }) :
      form.title || form.description || form.projectId || form.assigneeId;
    
    if (isModified && !loading) {
      setShowCloseConfirm(true);
    } else {
      handleCloseModal();
    }
  }, [form, editingTask, loading, isSubmitting, open, handleCloseModal, validateSession]);

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

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleCloseAttempt}
        title={editingTask ? "Edit Task" : "New Task"}
        actions={
          <button
            type="button"
            className="MuiButton-contained MuiButton-root"
            onClick={handleSubmit}
            disabled={
              loading ||
              isSubmitting ||
              !form.title ||
              !form.projectId ||
              !form.assigneeId
            }
            style={{
              padding: "6px 16px",
              background: "#6c63ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                loading ||
                isSubmitting ||
                !form.title ||
                !form.projectId ||
                !form.assigneeId
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading ||
                isSubmitting ||
                !form.title ||
                !form.projectId ||
                !form.assigneeId
                  ? 0.6
                  : 1,
            }}
          >
            {loading || isSubmitting
              ? "Saving..."
              : editingTask
                ? "Update"
                : "Create"}
          </button>
        }
      >
        <TextField
          label="Title"
          value={form.title}
          onChange={handleChange("title")}
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
          <InputLabel sx={{ color: "#888888" }}>Project</InputLabel>
          <Select
            value={form.projectId || ""}
            onChange={(e) =>
              setForm({ ...form, projectId: e.target.value, assigneeId: "" })
            }
            label="Project"
            sx={selectStyle}
            MenuProps={menuProps}
          >
            {availableProjects.length > 0 ? (
              availableProjects.map((p) => {
                const isProjectManager = Number(p.managerId) === Number(user.id);
                return (
                  <MenuItem key={p.id} value={p.id} sx={menuItemStyle}>
                    {p.name} 
                    {isProjectManager ? " (You are Manager)" : ""}
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem disabled sx={{ color: "#666666" }}>
                {user.role === "manager" 
                  ? "You can only create tasks for projects you manage"
                  : user.role === "employee"
                  ? "Employees cannot create tasks"
                  : "No projects available"}
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel sx={{ color: "#888888" }}>Assignee</InputLabel>
          <Select
            value={form.assigneeId || ""}
            disabled={!form.projectId || users.length === 0}
            onChange={handleSelectChange("assigneeId")}
            label="Assignee"
            sx={selectStyle}
            MenuProps={menuProps}
          >
            {users.length > 0 ? (
              users.map((u) => (
                <MenuItem key={u.id} value={u.id} sx={menuItemStyle}>
                  {getUserName(u.id, users)} ({u.role})
                  {Number(u.id) === Number(user.id) && " (You)"}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled sx={{ color: "#666666" }}>
                {form.projectId ? "No available assignees" : "Select a project first"}
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={{ color: "#888888" }}>Priority</InputLabel>
          <Select
            value={form.priority || "medium"}
            onChange={handleSelectChange("priority")}
            label="Priority"
            sx={selectStyle}
            MenuProps={menuProps}
          >
            {["low", "medium", "high"].map((p) => (
              <MenuItem key={p} value={p} sx={menuItemStyle}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
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
        title="Create New Task?"
        message={`Create task?\n\nTitle: ${form.title}\nProject: ${getProjectName(form.projectId, projects)}\nAssignee: ${getUserName(form.assigneeId, users)}\nPriority: ${form.priority}`}
        onConfirm={performSubmit}
        onCancel={() => setShowCreateConfirm(false)}
        confirmText="Create Task"
        cancelText="Cancel"
        confirmColor="primary"
      />

      <ConfirmationDialog
        open={showUpdateConfirm}
        title="Update Task?"
        message={`Update task?\n\nTitle: ${form.title}\nProject: ${getProjectName(form.projectId, projects)}\nAssignee: ${getUserName(form.assigneeId, users)}\nPriority: ${form.priority}`}
        onConfirm={performSubmit}
        onCancel={() => setShowUpdateConfirm(false)}
        confirmText="Update Task"
        cancelText="Cancel"
        confirmColor="primary"
      />
    </>
  );
}
