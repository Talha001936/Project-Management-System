// sNote: This component is responsible for displaying the task table with all tasks, 
// their details, and actions based on user roles and permissions.
import { useState } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  IconButton,
  Box,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { StatusChip, PriorityChip } from "../common/StatusChip.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";

const STATUSES = ["todo", "in-progress", "review", "done"];

export default function TaskTable({
  tasks,
  projects,
  users,
  currentUser,
  onViewDetails,
  onStatusUpdate,
  onEdit,
  onDelete,
}) {
  const [statusChangeState, setStatusChangeState] = useState({
    open: false,
    taskId: null,
    newStatus: null,
    taskTitle: "",
    currentStatus: "",
  });

  const getProjectName = (id) =>
    projects.find((p) => Number(p.id) === Number(id))?.name || `Project #${id}`;
  
  const getUserName = (id) =>
    users.find((u) => Number(u.id) === Number(id))?.name || `User #${id}`;

  const isUserProjectManager = (task) => {
    const project = projects.find(p => Number(p.id) === Number(task.projectId));
    if (!project) return false;
    return Number(project.managerId) === Number(currentUser.id);
  };

  const isUserProjectMemberOnly = (task) => {
    const project = projects.find(p => Number(p.id) === Number(task.projectId));
    if (!project) return false;
    
    if (Number(project.managerId) === Number(currentUser.id)) return false;
    
    const isIndividualMember = project.individualMembers?.some(id => Number(id) === Number(currentUser.id));
    
    const isInTeam = project.teamIds?.some(teamId => {
      const team = users.find(t => Number(t.id) === Number(teamId));
      return team?.members?.some(id => Number(id) === Number(currentUser.id));
    });
    
    return isIndividualMember || isInTeam;
  };

  const updateStatus = async (id, newStatus) => {
    const task = tasks.find(t => Number(t.id) === Number(id));
    if (!task) return;

    if (task.status === newStatus) return;

    setStatusChangeState({
      open: true,
      taskId: id,
      newStatus: newStatus,
      taskTitle: task.title,
      currentStatus: task.status,
    });
  };

  const confirmStatusUpdate = async () => {
    try {
      await api.patch(`/tasks/${statusChangeState.taskId}/status`, { 
        status: statusChangeState.newStatus 
      });
      onStatusUpdate();
      setStatusChangeState({ open: false, taskId: null, newStatus: null, taskTitle: "", currentStatus: "" });
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const selectStyle = {
    backgroundColor: "#0d0d0d",
    borderRadius: 1.5,
    "& .MuiSelect-icon": { color: "#888888" },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a2a2a" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6c63ff" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#6c63ff",
    },
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

  // Get status label for confirmation message
  const getStatusLabel = (status) => {
    const labels = {
      todo: "To Do",
      "in-progress": "In Progress",
      review: "Review",
      done: "Done"
    };
    return labels[status] || status;
  };

  return (
    <>
      <Paper
        sx={{
          border: "1px solid #2a2a2a",
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "#1a1a1a",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#0d0d0d" }}>
              {[
                "Title",
                "Project",
                "Assignee",
                "Status",
                "Priority",
                "Actions",
              ].map((label) => (
                <TableCell key={label} sx={{ color: "#888888", fontWeight: 600 }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((t) => {
              const isDone = t.status === "done";
              const isAssignee = Number(t.assigneeId) === Number(currentUser.id);
              const isCreator = Number(t.createdBy) === Number(currentUser.id);
              const isAdmin = currentUser.role === "admin";
              const isManager = currentUser.role === "manager";
              const isEmployee = currentUser.role === "employee";
              
              // Check if the user is the project manager for this task's project
              const isProjectManager = isUserProjectManager(t);
              
              // Check if the user is a member (not manager) of the project
              const isProjectMemberOnly = isUserProjectMemberOnly(t);
              
              // STATUS UPDATE PERMISSIONS:
              // Admin: CANNOT update status (only sees chip)
              // Manager (Project Manager): CANNOT update status (only sees chip) - they have edit/delete instead
              // Manager (Member only): Can update status if they are the assignee
              // Employee: Can update status only if they are the assignee AND task is not done
              const canUpdateStatus = 
                (isManager && isProjectMemberOnly && isAssignee && !isDone) ||  // Manager as Member + Assignee
                (isEmployee && isAssignee && !isDone);  // Employee as Assignee
              
              // EDIT PERMISSIONS:
              // - Admin: always can edit (if not done)
              // - Manager: can edit only if they are the project manager
              // - Employee: can edit only if they created the task
              const canEdit = !isDone && (
                isAdmin || 
                (isManager && isProjectManager) || 
                (isEmployee && isCreator)
              );
              
              // DELETE PERMISSIONS:
              // - Admin: always can delete (if not done)
              // - Manager: can delete only if they are the project manager
              // - Employee: cannot delete
              const canDelete = !isDone && (
                isAdmin || 
                (isManager && isProjectManager)
              );

              return (
                <TableRow
                  key={t.id}
                  sx={{
                    "&:hover": { backgroundColor: "rgba(108,99,255,0.04)" },
                    opacity: isDone ? 0.7 : 1,
                  }}
                >
                  <TableCell sx={{ color: "#e8e8e8", fontWeight: 500 }}>
                    {t.title}
                  </TableCell>
                  <TableCell sx={{ color: "#888888" }}>
                    {getProjectName(t.projectId)}
                  </TableCell>
                  <TableCell sx={{ color: "#888888" }}>
                    {getUserName(t.assigneeId)}
                  </TableCell>
                  <TableCell>
                    {canUpdateStatus ? (
                      <Select
                        size="small"
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        sx={{ minWidth: 110, ...selectStyle }}
                        MenuProps={menuProps}
                        renderValue={() => <StatusChip status={t.status} />}
                      >
                        {STATUSES.map((s) => (
                          <MenuItem
                            key={s}
                            value={s}
                            sx={{
                              color: "#e8e8e8",
                              "&:hover": {
                                backgroundColor: "rgba(108,99,255,0.08)",
                              },
                              "&.Mui-selected": {
                                backgroundColor: "rgba(108,99,255,0.12)",
                              },
                            }}
                          >
                            <StatusChip status={s} />
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <StatusChip status={t.status} />
                    )}
                  </TableCell>
                  <TableCell>
                    <PriorityChip priority={t.priority || "medium"} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(t)}
                        sx={{
                          color: "#888888",
                          "&:hover": {
                            color: "#6c63ff",
                            backgroundColor: "rgba(108,99,255,0.08)",
                          },
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {canEdit && (
                        <IconButton
                          size="small"
                          onClick={() => onEdit(t)}
                          sx={{
                            color: "#888888",
                            "&:hover": {
                              color: "#6c63ff",
                              backgroundColor: "rgba(108,99,255,0.08)",
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={() => onDelete(t.id)}
                          sx={{
                            color: "#888888",
                            "&:hover": {
                              color: "#d45454",
                              backgroundColor: "rgba(212,84,84,0.08)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <ConfirmationDialog
        open={statusChangeState.open}
        title="Update Task Status?"
        message={`Are you sure you want to change the status of "${statusChangeState.taskTitle}" from "${getStatusLabel(statusChangeState.currentStatus)}" to "${getStatusLabel(statusChangeState.newStatus)}"?`}
        onConfirm={confirmStatusUpdate}
        onCancel={() => setStatusChangeState({ open: false, taskId: null, newStatus: null, taskTitle: "", currentStatus: "" })}
        confirmText="Update Status"
        cancelText="Cancel"
        confirmColor="primary"
      />
    </>
  );
}