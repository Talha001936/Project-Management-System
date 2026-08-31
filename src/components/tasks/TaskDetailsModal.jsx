// Note: This file is a task details modal component for the application. 
// It displays detailed information about a task. It also provides functionality 
// to update the task status with confirmation, and it handles user permissions for status updates.
import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, Stack, Box, Divider, Select, MenuItem, Alert } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import { StatusChip, PriorityChip } from "../common/StatusChip.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";

const STATUSES = ["todo", "in-progress", "review", "done"];

export default function TaskDetailsModal({ task, open, onClose, onUpdate, users, projects }) {
  const { user } = useAuth();
  const { loading, error, setError, execute } = useApi();
  const [statusConfirmState, setStatusConfirmState] = useState({
    open: false,
    newStatus: null,
  });
  
  const getUserName = (id) => {
    if (!id) return "Unassigned";
    const found = users.find((u) => Number(u.id) === Number(id));
    return found?.name || `User #${id}`;
  };
  
  const canUpdateStatus = user.role === "admin" || user.role === "manager";

  if (!task) return null;

  const handleStatusUpdate = (newStatus) => {
   
    if (task.status === newStatus) return;
    
   
    setStatusConfirmState({
      open: true,
      newStatus: newStatus,
    });
  };

  const confirmStatusUpdate = async () => {
    const newStatus = statusConfirmState.newStatus;
    await execute(
      () => api.patch(`/tasks/${task.id}/status`, { status: newStatus }),
      () => {
        setStatusConfirmState({ open: false, newStatus: null });
        onUpdate();
      },
    );
  };

  
  const getStatusLabel = (status) => {
    const labels = {
      todo: "To Do",
      "in-progress": "In Progress",
      review: "Review",
      done: "Done"
    };
    return labels[status] || status;
  };

  const InfoRow = ({ label, value }) => (
    <Box>
      <Typography
        variant="caption"
        sx={{
          color: "#666666",
          fontWeight: 500,
          display: "block",
          mb: 0.5,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontSize: "0.7rem",
        }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: "#e8e8e8" }}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1a1a1a",
            borderRadius: 3,
            border: "1px solid #2a2a2a",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          },
        }}
      >
        <DialogTitle
          sx={{ borderBottom: "1px solid #2a2a2a", pb: 2, color: "#e8e8e8" }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ color: "#e8e8e8", fontWeight: 600 }}>
              {task.title}
            </Typography>
            <Stack direction="row" spacing={1}>
              <StatusChip status={task.status} />
              <PriorityChip priority={task.priority || "medium"} />
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ borderColor: "#2a2a2a", pt: 3, backgroundColor: "#1a1a1a" }}
        >
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
          <Typography variant="body2" sx={{ color: "#888888", mb: 3 }}>
            {task.description || "No description provided"}
          </Typography>
          <Divider sx={{ borderColor: "#2a2a2a", mb: 3 }} />
          <Stack spacing={2.5}>
            <InfoRow
              label="Project"
              value={
                projects.find((p) => Number(p.id) === Number(task.projectId))?.name ||
                `Project #${task.projectId}`
              }
            />
            <InfoRow label="Assignee" value={getUserName(task.assigneeId)} />
            <InfoRow label="Created By" value={getUserName(task.createdBy)} />
            <InfoRow label="Priority" value={task.priority || "medium"} />
            <InfoRow
              label="Created At"
              value={new Date(task.createdAt).toLocaleDateString()}
            />
            {task.updatedAt && (
              <InfoRow
                label="Updated At"
                value={new Date(task.updatedAt).toLocaleDateString()}
              />
            )}
          </Stack>
          
          {/* Only show status update section for admin and manager */}
          {canUpdateStatus && task.status !== "done" && (
            <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid #2a2a2a" }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontWeight: 500,
                  display: "block",
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontSize: "0.7rem",
                }}
              >
                Update Status
              </Typography>
              <Select
                size="small"
                value={task.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                sx={{
                  minWidth: 150,
                  backgroundColor: "#0d0d0d",
                  borderRadius: 1.5,
                  "& .MuiSelect-icon": { color: "#888888" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2a2a2a",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#6c63ff",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#6c63ff",
                  },
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
                {STATUSES.map((s) => (
                  <MenuItem
                    key={s}
                    value={s}
                    sx={{
                      color: "#e8e8e8",
                      "&:hover": { backgroundColor: "rgba(108,99,255,0.08)" },
                      "&.Mui-selected": {
                        backgroundColor: "rgba(108,99,255,0.12)",
                      },
                    }}
                  >
                    <StatusChip status={s} />
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{ borderTop: "1px solid #2a2a2a", pt: 2, pb: 2, px: 3 }}
        >
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              backgroundColor: "#6c63ff",
              "&:hover": { backgroundColor: "#5a52e8" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

     
      <ConfirmationDialog
        open={statusConfirmState.open}
        title="Update Task Status?"
        message={`Are you sure you want to change the status of "${task.title}" from "${getStatusLabel(task.status)}" to "${getStatusLabel(statusConfirmState.newStatus)}"?`}
        onConfirm={confirmStatusUpdate}
        onCancel={() => setStatusConfirmState({ open: false, newStatus: null })}
        confirmText="Update Status"
        cancelText="Cancel"
        confirmColor="primary"
        loading={loading}
      />
    </>
  );
}