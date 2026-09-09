
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
import { getUserName } from "../../utils/helpers.js";

const ROLES = ["manager", "employee"];

export default function UserTable({
  users,
  onViewDetails,
  onRoleChange,
  onStatusToggle,
  onDelete,
}) {
  const { showSuccess, showError } = useToast();
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

  const [deleteState, setDeleteState] = useState({ open: false, userId: null, userName: "" });

  const changeRole = async (id, newRole) => {
    const user = users.find(u => Number(u.id) === Number(id));
    if (!user || user.role === newRole) return;

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
      await api.patch(`/users/${roleChangeState.userId}/role`, { role: roleChangeState.newRole });
      showSuccess(`Role changed to ${roleChangeState.newRole}`);
      if (onRoleChange) onRoleChange();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to change role");
    }
    setRoleChangeState({ open: false, userId: null, newRole: null, userName: "", currentRole: "" });
  };

  const toggleActive = async (id, currentActive) => {
    const user = users.find(u => Number(u.id) === Number(id));
    if (!user || user.role === "admin") {
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
      await api.patch(`/users/${statusChangeState.userId}/status`, { active: statusChangeState.newStatus });
      showSuccess(`User ${statusChangeState.newStatus ? "activated" : "deactivated"}`);
      if (onStatusToggle) onStatusToggle();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update status");
    }
    setStatusChangeState({ open: false, userId: null, newStatus: null, userName: "", currentStatus: false });
  };

  const handleDeleteClick = (user) => {
    if (user.role === "admin") {
      showError("Cannot delete admin");
      return;
    }
    setDeleteState({ open: true, userId: user.id, userName: user.name });
  };

  const confirmDelete = async () => {
    try {
      await onDelete(deleteState.userId);
    } finally {
      setDeleteState({ open: false, userId: null, userName: "" });
    }
  };

  return (
    <>
      <Paper sx={{ border: "1px solid #2a2a2a", borderRadius: 3, overflow: "hidden", backgroundColor: "#1a1a1a" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#0d0d0d" }}>
              {["Name", "Email", "Role", "Status", "Active", "Actions"].map((label) => (
                <TableCell key={label} sx={{ color: "#888888", fontWeight: 600 }}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const isAdmin = u.role === "admin";
              const isInactive = u.active === false;

              return (
                <TableRow key={u.id} sx={{ "&:hover": { backgroundColor: "rgba(108,99,255,0.04)" } }}>
                  <TableCell sx={{ color: isInactive ? "#666666" : "#e8e8e8", fontWeight: 500 }}>
                    {u.name}
                    {isAdmin && <Chip size="small" label="Admin" sx={{ ml: 1, backgroundColor: "rgba(212,84,84,0.12)", color: "#d45454", border: "1px solid rgba(212,84,84,0.25)", fontWeight: 600, fontSize: "0.6rem", height: 20 }} />}
                  </TableCell>
                  <TableCell sx={{ color: isInactive ? "#666666" : "#888888" }}>{u.email}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Chip size="small" label="admin" sx={{ backgroundColor: "rgba(212,84,84,0.12)", color: "#d45454", border: "1px solid rgba(212,84,84,0.25)", fontWeight: 500 }} />
                    ) : (
                      <Select
                        size="small"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        sx={{ backgroundColor: "#0d0d0d", borderRadius: 1.5, color: "#e8e8e8", "& .MuiSelect-icon": { color: "#888888" } }}
                        MenuProps={{ PaperProps: { sx: { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px" } } }}
                      >
                        {ROLES.map((r) => (
                          <MenuItem key={r} value={r} sx={{ color: "#e8e8e8" }}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={u.active ? "Active" : "Inactive"} sx={{ backgroundColor: u.active ? "rgba(74,158,74,0.12)" : "rgba(102,102,102,0.12)", color: u.active ? "#4a9e4a" : "#666666", border: u.active ? "1px solid rgba(74,158,74,0.25)" : "1px solid rgba(102,102,102,0.2)", fontWeight: 500 }} />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.active}
                      onChange={() => toggleActive(u.id, u.active)}
                      disabled={isAdmin}
                      sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#6c63ff" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#6c63ff" } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => onViewDetails(u)} sx={{ color: "#888888" }}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {!isAdmin && (
                        <IconButton size="small" onClick={() => handleDeleteClick(u)} sx={{ color: "#888888" }}>
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

      <ConfirmationDialog open={roleChangeState.open} title="Change Role?" message={`Change "${roleChangeState.userName}" from "${roleChangeState.currentRole}" to "${roleChangeState.newRole}"?`} onConfirm={confirmRoleChange} onCancel={() => setRoleChangeState({ open: false, userId: null, newRole: null, userName: "", currentRole: "" })} confirmText="Change" confirmColor="primary" />

      <ConfirmationDialog open={statusChangeState.open} title={statusChangeState.newStatus ? "Activate?" : "Deactivate?"} message={`${statusChangeState.newStatus ? "Activate" : "Deactivate"} "${statusChangeState.userName}"?`} onConfirm={confirmStatusToggle} onCancel={() => setStatusChangeState({ open: false, userId: null, newStatus: null, userName: "", currentStatus: false })} confirmText={statusChangeState.newStatus ? "Activate" : "Deactivate"} confirmColor={statusChangeState.newStatus ? "primary" : "error"} />

      <ConfirmationDialog open={deleteState.open} title="Delete User?" message={`Delete "${deleteState.userName}"? This cannot be undone.`} onConfirm={confirmDelete} onCancel={() => setDeleteState({ open: false, userId: null, userName: "" })} confirmText="Delete" confirmColor="error" />
    </>
  );
}
