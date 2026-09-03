// Note: This component displays a table of users with their details, including name, email, role, status, and active state.
import { useState } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Select,
  MenuItem,
  Switch,
  IconButton,
  Box,
} from "@mui/material";
import { Visibility as ViewIcon, Delete as DeleteIcon } from "@mui/icons-material";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";
import { useToast } from "../../hooks/useToast.jsx";

const ROLES = ["manager", "employee"];

export default function UserTable({
  users,
  onViewDetails,
  onRoleChange,
  onStatusToggle,
  onDelete,
}) {
  const { showSuccess, showError, showWarning } = useToast();
  const [roleChangeState, setRoleChangeState] = useState({
    open: false,
    userId: null,
    newRole: null,
    userName: "",
    currentRole: "",
  });

  const [statusChangeState, setStatusChangeState] = useState({
    open: false,
    userId: null,
    newStatus: null,
    userName: "",
    currentStatus: false,
  });

  const [deleteState, setDeleteState] = useState({
    open: false,
    userId: null,
    userName: "",
  });

  const changeRole = async (id, newRole) => {
    const user = users.find(u => Number(u.id) === Number(id));
    if (!user) {
      showWarning("User not found");
      return;
    }

    if (user.role === newRole) return;

    setRoleChangeState({
      open: true,
      userId: id,
      newRole: newRole,
      userName: user.name,
      currentRole: user.role,
    });
  };

  const confirmRoleChange = async () => {
    try {
      await api.patch(`/users/${roleChangeState.userId}/role`, {
        role: roleChangeState.newRole
      });
      showSuccess(`Role changed to ${roleChangeState.newRole}`);
      onRoleChange();
      setRoleChangeState({ open: false, userId: null, newRole: null, userName: "", currentRole: "" });
    } catch (err) {
      console.error("Role change error:", err);
      if (err.response?.status === 404) {
        showWarning("User not found. Refreshing list...");
        onRoleChange();
      } else {
        showError(err.response?.data?.message || "Failed to change role");
      }
      setRoleChangeState({ open: false, userId: null, newRole: null, userName: "", currentRole: "" });
    }
  };

  const toggleActive = async (id, currentActive) => {
    const user = users.find(u => Number(u.id) === Number(id));
    if (!user) {
      showWarning("User not found");
      return;
    }

    if (user.role === "admin") {
      showError("Cannot change admin status");
      return;
    }

    setStatusChangeState({
      open: true,
      userId: id,
      newStatus: !currentActive,
      userName: user.name,
      currentStatus: currentActive,
    });
  };

  const confirmStatusToggle = async () => {
    try {
      await api.patch(`/users/${statusChangeState.userId}/status`, {
        active: statusChangeState.newStatus
      });
      showSuccess(`User ${statusChangeState.newStatus ? "activated" : "deactivated"}`);
      onStatusToggle();
      setStatusChangeState({ open: false, userId: null, newStatus: null, userName: "", currentStatus: false });
    } catch (err) {
      console.error("Status toggle error:", err);
      if (err.response?.status === 404) {
        showWarning("User not found. Refreshing list...");
        onStatusToggle();
      } else {
        showError(err.response?.data?.message || "Failed to update user status");
      }
      setStatusChangeState({ open: false, userId: null, newStatus: null, userName: "", currentStatus: false });
    }
  };

  const handleDeleteClick = (user) => {
    if (user.role === "admin") {
      showError("Cannot delete admin users");
      return;
    }
    setDeleteState({
      open: true,
      userId: user.id,
      userName: user.name,
    });
  };

  const confirmDelete = async () => {
    try {
      await onDelete(deleteState.userId);
      // The parent component will handle the reload
      setDeleteState({ open: false, userId: null, userName: "" });
    } catch (err) {
      // Error is handled in parent
      setDeleteState({ open: false, userId: null, userName: "" });
    }
  };

  const selectStyle = {
    color: "#e8e8e8",
    backgroundColor: "#0d0d0d",
    borderRadius: 1.5,
    "& .MuiSelect-icon": { color: "#888888" },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a2a2a" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6c63ff" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#6c63ff",
    },
    "&.Mui-disabled": { opacity: 0.7 },
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
              {["Name", "Email", "Role", "Status", "Active", "Actions"].map(
                (label) => (
                  <TableCell
                    key={label}
                    sx={{ color: "#888888", fontWeight: 600 }}
                  >
                    {label}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const isAdmin = u.role === "admin";
              const isInactive = u.active === false;

              return (
                <TableRow
                  key={u.id}
                  sx={{
                    "&:hover": { backgroundColor: "rgba(108,99,255,0.04)" },
                    opacity: isAdmin ? 0.9 : isInactive ? 0.6 : 1,
                    backgroundColor: isInactive ? "rgba(102,102,102,0.05)" : "transparent",
                  }}
                >
                  <TableCell sx={{ color: isInactive ? "#666666" : "#e8e8e8", fontWeight: 500 }}>
                    {u.name}
                    {isAdmin && (
                      <Chip
                        size="small"
                        label="Admin"
                        sx={{
                          ml: 1,
                          backgroundColor: "rgba(212,84,84,0.12)",
                          color: "#d45454",
                          border: "1px solid rgba(212,84,84,0.25)",
                          fontWeight: 600,
                          fontSize: "0.6rem",
                          height: 20,
                        }}
                      />
                    )}
                    {isInactive && (
                      <Chip
                        size="small"
                        label="Inactive"
                        sx={{
                          ml: 1,
                          backgroundColor: "rgba(102,102,102,0.12)",
                          color: "#666666",
                          border: "1px solid rgba(102,102,102,0.2)",
                          fontWeight: 600,
                          fontSize: "0.6rem",
                          height: 20,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ color: isInactive ? "#666666" : "#888888" }}>
                    {u.email}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Chip
                        size="small"
                        label="admin"
                        sx={{
                          backgroundColor: "rgba(212,84,84,0.12)",
                          color: "#d45454",
                          border: "1px solid rgba(212,84,84,0.25)",
                          fontWeight: 500,
                          textTransform: "capitalize",
                          opacity: isInactive ? 0.6 : 1,
                        }}
                      />
                    ) : (
                      <Select
                        size="small"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        sx={{
                          ...selectStyle,
                          opacity: isInactive ? 0.6 : 1,
                        }}
                        MenuProps={menuProps}
                      >
                        {ROLES.map((r) => (
                          <MenuItem key={r} value={r} sx={menuItemStyle}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.active ? "Active" : "Inactive"}
                      sx={{
                        backgroundColor: u.active
                          ? "rgba(74,158,74,0.12)"
                          : "rgba(102,102,102,0.12)",
                        color: u.active ? "#4a9e4a" : "#666666",
                        fontWeight: 500,
                        border: u.active
                          ? "1px solid rgba(74,158,74,0.25)"
                          : "1px solid rgba(102,102,102,0.2)",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.active}
                      onChange={() => toggleActive(u.id, u.active)}
                      disabled={isAdmin}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#6c63ff",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        { backgroundColor: "#6c63ff" },
                        "& .MuiSwitch-track": { backgroundColor: "#2a2a2a" },
                        "& .MuiSwitch-switchBase.Mui-disabled": {
                          color: "#666666",
                        },
                        "& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track":
                        { backgroundColor: "#1a1a1a" },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(u)}
                        sx={{
                          color: isInactive ? "#666666" : "#888888",
                          "&:hover": {
                            color: "#6c63ff",
                            backgroundColor: "rgba(108,99,255,0.08)",
                          },
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {!isAdmin && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(u)}
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
        open={roleChangeState.open}
        title="Change User Role?"
        message={`Are you sure you want to change "${roleChangeState.userName}"'s role from "${roleChangeState.currentRole}" to "${roleChangeState.newRole}"?`}
        onConfirm={confirmRoleChange}
        onCancel={() => setRoleChangeState({ open: false, userId: null, newRole: null, userName: "", currentRole: "" })}
        confirmText="Change Role"
        cancelText="Cancel"
        confirmColor="primary"
      />

      <ConfirmationDialog
        open={statusChangeState.open}
        title={statusChangeState.newStatus ? "Activate User?" : "Deactivate User?"}
        message={`Are you sure you want to ${statusChangeState.newStatus ? "activate" : "deactivate"} "${statusChangeState.userName}"?\n\n${statusChangeState.newStatus ? "The user will be able to log in and access the system." : "The user will not be able to log in or access the system."}`}
        onConfirm={confirmStatusToggle}
        onCancel={() => setStatusChangeState({ open: false, userId: null, newStatus: null, userName: "", currentStatus: false })}
        confirmText={statusChangeState.newStatus ? "Activate" : "Deactivate"}
        cancelText="Cancel"
        confirmColor={statusChangeState.newStatus ? "primary" : "error"}
      />

      <ConfirmationDialog
        open={deleteState.open}
        title="Delete User?"
        message={`Are you sure you want to delete "${deleteState.userName}"?\n\nThis action cannot be undone. All associated data (tasks, teams, projects) will be affected.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteState({ open: false, userId: null, userName: "" })}
        confirmText="Delete User"
        cancelText="Cancel"
        confirmColor="error"
      />
    </>
  );
}