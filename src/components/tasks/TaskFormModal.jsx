// Note: This file is a task form modal component for the application.
import { useEffect, useState } from "react";
import { TextField, Select, MenuItem, FormControl, InputLabel, Alert } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import { useForm } from "../../hooks/useForm.js";
import { useApi } from "../../hooks/useApi.js";
import BaseModal from "../common/BaseModal.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import { StatusChip } from "../common/StatusChip.jsx";
import api from "../../api/axios.js";

const INITIAL = { title: "", description: "", projectId: "", assigneeId: "", status: "todo", priority: "medium" };
const STATUSES = ["todo", "in-progress", "review", "done"];

export default function TaskFormModal({ open, onClose, onSuccess, projects, users, teams, editingTask }) {
  const { user } = useAuth();
  const { loading, error, setError, execute } = useApi();
  const { form, setForm, handleChange, handleSelectChange, resetForm } = useForm(INITIAL);
  const [assignees, setAssignees] = useState([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);

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
    }
  }, [editingTask, open]);

  useEffect(() => {
    if (!projects.length) return;

    let filtered = [];
    
    if (user.role === "admin") {
      filtered = projects;
    } else if (user.role === "manager") {

      filtered = projects.filter(p => 
        Number(p.managerId) === Number(user.id)
      );
    } else if (user.role === "employee") {
      const userTeamIds = teams
        .filter(t => t.members?.some(id => Number(id) === Number(user.id)))
        .map(t => t.id);
      
      filtered = projects.filter(p => 
        p.individualMembers?.some(id => Number(id) === Number(user.id)) ||
        p.teamIds?.some(teamId => userTeamIds.includes(Number(teamId)))
      );
    }
    
    setAvailableProjects(filtered);
  }, [projects, teams, user]);

  useEffect(() => {
    if (!form.projectId || !projects.length || !teams.length || !users.length) { 
      setAssignees([]); 
      return; 
    }
    
    const project = projects.find(p => Number(p.id) === Number(form.projectId));
    if (!project) {
      setAssignees([]);
      return;
    }
    const members = new Set();
    project.teamIds?.forEach(id => {
      const team = teams.find(t => Number(t.id) === Number(id));
      team?.members?.forEach(mid => members.add(Number(mid)));
    });
    
    project.individualMembers?.forEach(id => members.add(Number(id)));
    
    if (project.managerId) members.add(Number(project.managerId));
    
    let availableAssignees = users.filter(u => 
      members.has(Number(u.id)) && u.active
    );
    
    if (user.role === "manager") {
      const isProjectManager = Number(project.managerId) === Number(user.id);
      if (!isProjectManager) {
        availableAssignees = availableAssignees.filter(u => Number(u.id) === Number(user.id));
      }
    }
    
    setAssignees(availableAssignees);
    
    if (editingTask && form.assigneeId) {
      const stillValid = availableAssignees.some(u => Number(u.id) === Number(form.assigneeId));
      if (!stillValid) {
        setForm(prev => ({ ...prev, assigneeId: "" }));
      }
    }
  }, [form.projectId, projects, teams, users, editingTask, user]);

  const getName = (id, list) => list?.find(i => Number(i.id) === Number(id))?.name || `#${id}`;
  const getProjectName = () => getName(form.projectId, projects);
  const getAssigneeName = () => getName(form.assigneeId, users);

  const handleSubmit = () => {
    if (!form.title || !form.projectId || !form.assigneeId) {
      setError("Please fill in all required fields");
      return;
    }

    if (editingTask) {
      const hasChanges = form.title !== editingTask.title || 
        form.description !== editingTask.description ||
        Number(form.projectId) !== Number(editingTask.projectId) || 
        Number(form.assigneeId) !== Number(editingTask.assigneeId) ||
        form.priority !== editingTask.priority;
      
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
    const data = { ...form };
    if (!editingTask) data.status = "todo";
    const call = editingTask ? () => api.put(`/tasks/${editingTask.id}`, data) : () => api.post("/tasks", data);
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
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <TextField
          label="Title"
          value={form.title}
          onChange={handleChange("title")}
          fullWidth
          required
        />
        <TextField
          label="Description"
          multiline
          rows={2}
          value={form.description}
          onChange={handleChange("description")}
          fullWidth
        />

        <FormControl fullWidth required>
          <InputLabel sx={{ color: "#888888" }}>Project</InputLabel>
          <Select
            value={form.projectId || ""}
            onChange={(e) =>
              setForm({ ...form, projectId: e.target.value, assigneeId: "" })
            }
            label="Project"
            sx={selectStyle}
            MenuProps={menuProps}
            displayEmpty
          >
            {availableProjects.length > 0 ? (
              availableProjects.map((p) => {
                const isProjectManager = Number(p.managerId) === Number(user.id);
                return (
                  <MenuItem key={p.id} value={p.id} sx={menuItemStyle}>
                    {p.name} 
                    {isProjectManager && " (You are Manager)"}
                    {!isProjectManager && user.role === "manager" && " (Limited Access)"}
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem disabled sx={{ color: "#666666" }}>
                {user.role === "manager" 
                  ? "You can only create tasks for projects you manage or are individually assigned to"
                  : "No projects available"}
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel sx={{ color: "#888888" }}>Assignee</InputLabel>
          <Select
            value={form.assigneeId || ""}
            disabled={!form.projectId}
            onChange={handleSelectChange("assigneeId")}
            label="Assignee"
            sx={selectStyle}
            MenuProps={menuProps}
            displayEmpty
          >
            {assignees.length > 0 ? (
              assignees.map((u) => (
                <MenuItem key={u.id} value={u.id} sx={menuItemStyle}>
                  {u.name} ({u.role})
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
        message={`Create task?\n\nTitle: ${form.title}\nProject: ${getProjectName()}\nAssignee: ${getAssigneeName()}\nPriority: ${form.priority}`}
        onConfirm={performSubmit}
        onCancel={() => setShowCreateConfirm(false)}
        confirmText="Create Task"
        cancelText="Cancel"
        confirmColor="primary"
      />

      <ConfirmationDialog
        open={showUpdateConfirm}
        title="Update Task?"
        message={`Update task?\n\nTitle: ${form.title}\nProject: ${getProjectName()}\nAssignee: ${getAssigneeName()}\nPriority: ${form.priority}`}
        onConfirm={performSubmit}
        onCancel={() => setShowUpdateConfirm(false)}
        confirmText="Update Task"
        cancelText="Cancel"
        confirmColor="primary"
      />
    </>
  );
}