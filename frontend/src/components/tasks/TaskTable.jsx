// Note: This file defines a TaskTable component that displays a list of tasks in a table format. It includes 
// functionality for viewing task details, updating task status, editing, and deleting tasks based on user permissions.
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
import { hasValidSession, clearSession } from "../../utils/permissions.js";
import api from "../../api/axios.js";
import { useToast } from "../../hooks/useToast.jsx";

const STATUSES = ["todo", "in-progress", "review", "done"];

export default function TaskTable({
  tasks,
  projects = [], 
  users = [], 
  currentUser,
  onViewDetails,
  onStatusUpdate,
  onEdit,
  onDelete,
}) {
  const { showSuccess, showError, showWarning } = useToast();
  const [statusChangeState, setStatusChangeState] = useState({
    open: false,
    taskId: null,
    newStatus: null,
    taskTitle: "",
    currentStatus: "",
  });

const getProjectName = (id) => {
  if (!id) return "No Project";
  const project = projects.find((p) => Number(p.id) === Number(id));
  return project?.name || `Project #${id}`;
};

const getUserName = (id) => {
  if (!id) return "Unassigned";
  const user = users.find((u) => Number(u.id) === Number(id));
  return user?.name || `User #${id}`;
};

  const getStatusLabel = (status) => {
    const labels = { todo: "To Do", "in-progress": "In Progress", review: "Review", done: "Done" };
    return labels[status] || status;
  };

  const isProjectManager = (task) => {
    const project = projects.find(p => Number(p.id) === Number(task.projectId));
    if (!project) return false;
    return Number(project.managerId) === Number(currentUser.id);
  };

  const isProjectMemberOnly = (task) => {
    const project = projects.find(p => Number(p.id) === Number(task.projectId));
    if (!project) return false;

    if (Number(project.managerId) === Number(currentUser.id)) return false;

    const isIndividualMember = project.individualMembers?.some(
      id => Number(id) === Number(currentUser.id)
    );

    const isInTeam = project.teamIds?.some(teamId => {
      const team = users.find(t => Number(t.id) === Number(teamId));
      return team?.members?.some(id => Number(id) === Number(currentUser.id));
    });

    return isIndividualMember || isInTeam;
  };

  const getTaskPermissions = (task) => {
    const isDone = task.status === "done";
    const isAdmin = currentUser.role === "admin";
    const isManager = currentUser.role === "manager";
    const isEmployee = currentUser.role === "employee";

    const isProjectMgr = isProjectManager(task);
    const isMemberOnly = isProjectMemberOnly(task);
    const isAssignee = Number(task.assigneeId) === Number(currentUser.id);
    const isCreator = Number(task.createdBy) === Number(currentUser.id);

    if (isAdmin) {
      return {
        canView: true,
        canUpdateStatus: false,
        canEdit: !isDone,
        canDelete: !isDone,
        canCreate: true,
        isAdmin: true,
        isProjectManager: false,
        isAssignee: false,
        isMemberOnly: false,
        roleLabel: 'Admin',
        roleColor: '#d45454',
        roleBg: 'rgba(212,84,84,0.12)',
      };
    }

    if (isManager) {
      if (isProjectMgr) {
        return {
          canView: true,
          canUpdateStatus: false,
          canEdit: !isDone,
          canDelete: !isDone,
          canCreate: true,
          isAdmin: false,
          isProjectManager: true,
          isAssignee: isAssignee,
          isMemberOnly: false,
          roleLabel: 'PM',
          roleColor: '#f0a030',
          roleBg: 'rgba(240,160,48,0.12)',
        };
      }

      if (isMemberOnly) {
        if (isAssignee) {
          return {
            canView: true,
            canUpdateStatus: !isDone,
            canEdit: false,
            canDelete: false,
            canCreate: false,
            isAdmin: false,
            isProjectManager: false,
            isAssignee: true,
            isMemberOnly: true,
            roleLabel: 'Assignee',
            roleColor: '#6c63ff',
            roleBg: 'rgba(108,99,255,0.12)',
          };
        }
        return {
          canView: true,
          canUpdateStatus: false,
          canEdit: false,
          canDelete: false,
          canCreate: false,
          isAdmin: false,
          isProjectManager: false,
          isAssignee: false,
          isMemberOnly: true,
          roleLabel: 'Member',
          roleColor: '#4a9e4a',
          roleBg: 'rgba(74,158,74,0.12)',
        };
      }

      return {
        canView: false,
        canUpdateStatus: false,
        canEdit: false,
        canDelete: false,
        canCreate: false,
        isAdmin: false,
        isProjectManager: false,
        isAssignee: false,
        isMemberOnly: false,
        roleLabel: null,
        roleColor: null,
        roleBg: null,
      };
    }

    if (isEmployee) {
      if (isAssignee || isCreator) {
        return {
          canView: true,
          canUpdateStatus: !isDone,
          canEdit: false,
          canDelete: false,
          canCreate: false,
          isAdmin: false,
          isProjectManager: false,
          isAssignee: true,
          isMemberOnly: false,
          roleLabel: 'Assignee',
          roleColor: '#6c63ff',
          roleBg: 'rgba(108,99,255,0.12)',
        };
      }

      return {
        canView: false,
        canUpdateStatus: false,
        canEdit: false,
        canDelete: false,
        canCreate: false,
        isAdmin: false,
        isProjectManager: false,
        isAssignee: false,
        isMemberOnly: false,
        roleLabel: null,
        roleColor: null,
        roleBg: null,
      };
    }

    return {
      canView: false,
      canUpdateStatus: false,
      canEdit: false,
      canDelete: false,
      canCreate: false,
      isAdmin: false,
      isProjectManager: false,
      isAssignee: false,
      isMemberOnly: false,
      roleLabel: null,
      roleColor: null,
      roleBg: null,
    };
  };

  const updateStatus = async (id, newStatus) => {
    if (!hasValidSession()) {
      clearSession();
      window.location.href = '/login';
      return;
    }

    const task = tasks.find(t => Number(t.id) === Number(id));
    if (!task || task.status === newStatus) return;

    const { canUpdateStatus } = getTaskPermissions(task);
    if (!canUpdateStatus) {
      showError("Only the assignee can update task status", 'Permission Denied');
      return;
    }

    setStatusChangeState({
      open: true,
      taskId: id,
      newStatus: newStatus,
      taskTitle: task.title,
      currentStatus: task.status,
    });
  };

  const confirmStatusUpdate = async () => {
    if (!hasValidSession()) {
      clearSession();
      setStatusChangeState({ open: false, taskId: null, newStatus: null, taskTitle: "", currentStatus: "" });
      window.location.href = '/login';
      return;
    }

    try {
      await api.patch(`/tasks/${statusChangeState.taskId}/status`, {
        status: statusChangeState.newStatus
      });
      const statusLabels = { todo: "To Do", "in-progress": "In Progress", review: "Review", done: "Done" };
      showSuccess(
        `Task status updated to ${statusLabels[statusChangeState.newStatus] || statusChangeState.newStatus}`,
        'Status Updated'
      );
      onStatusUpdate();
      setStatusChangeState({ open: false, taskId: null, newStatus: null, taskTitle: "", currentStatus: "" });
    } catch (err) {
      if (err.response?.status === 403) {
        showError("You don't have permission to update this task status", 'Permission Denied');
      } else {
        showError(err.response?.data?.message || "Failed to update status", 'Error');
      }
    }
  };

  const selectStyle = {
    backgroundColor: "#0d0d0d",
    borderRadius: 1.5,
    "& .MuiSelect-icon": { color: "#888888" },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a2a2a" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6c63ff" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6c63ff" },
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
              {["Title", "Project", "Assignee", "Status", "Priority", "Actions"].map((label) => (
                <TableCell key={label} sx={{ color: "#888888", fontWeight: 600 }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((t) => {
              const {
                canUpdateStatus,
                canEdit,
                canDelete,
                roleLabel,
                roleColor,
                roleBg
              } = getTaskPermissions(t);

              const isDone = t.status === "done";

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
                    {roleLabel && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '0.6rem',
                        color: roleColor,
                        backgroundColor: roleBg,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${roleColor}33`,
                        fontWeight: 600
                      }}>
                        {roleLabel}
                      </span>
                    )}
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
                          <MenuItem key={s} value={s} sx={{ color: "#e8e8e8" }}>
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
                        onClick={() => {
                          if (!hasValidSession()) {
                            clearSession();
                            window.location.href = '/login';
                            return;
                          }
                          onViewDetails(t);
                        }}
                        sx={{ color: "#888888", "&:hover": { color: "#6c63ff" } }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {canEdit && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (!hasValidSession()) {
                              clearSession();
                              window.location.href = '/login';
                              return;
                            }
                            onEdit(t);
                          }}
                          sx={{ color: "#888888", "&:hover": { color: "#6c63ff" } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (!hasValidSession()) {
                              clearSession();
                              window.location.href = '/login';
                              return;
                            }
                            onDelete(t.id);
                          }}
                          sx={{ color: "#888888", "&:hover": { color: "#d45454" } }}
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
        message={`Change "${statusChangeState.taskTitle}" from "${getStatusLabel(statusChangeState.currentStatus)}" to "${getStatusLabel(statusChangeState.newStatus)}"?`}
        onConfirm={confirmStatusUpdate}
        onCancel={() => setStatusChangeState({ open: false, taskId: null, newStatus: null, taskTitle: "", currentStatus: "" })}
        confirmText="Update Status"
        cancelText="Cancel"
        confirmColor="primary"
      />
    </>
  );
}