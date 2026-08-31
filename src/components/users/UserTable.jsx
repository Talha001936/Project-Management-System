// Note: This component is responsible for rendering a table of users with their
// details, allowing role changes and status toggling. It includes confirmation dialogs 
// for sensitive actions.
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
} from "@mui/material";
import { Visibility as ViewIcon } from "@mui/icons-material";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";

const ROLES = ["manager", "employee"];

export default function UserTable({
  users,
  onViewDetails,
  onRoleChange,
  onStatusToggle,
}) {
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

  const changeRole = async (id, newRole) => {
    const user = users.find(u => Number(u.id) === Number(id));
    if (!user) return;

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
      onRoleChange();
      setRoleChangeState({ open: false, userId: null, newRole: null, userName: "", currentRole: "" });
    } catch (err) {
      console.error("Role change error:", err);
    }
  };

  const toggleActive = async (id, currentActive) => {
    const user = users.find(u => Number(u.id) === Number(id));
    if (!user) return;
    
    if (user.role === "admin") return;

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
      onStatusToggle();
      setStatusChangeState({ open: false, userId: null, newStatus: null, userName: "", currentStatus: false });
    } catch (err) {
      console.error("Status toggle error:", err);
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
              return (
                <TableRow
                  key={u.id}
                  sx={{
                    "&:hover": { backgroundColor: "rgba(108,99,255,0.04)" },
                    opacity: isAdmin ? 0.9 : 1,
                  }}
                >
                  <TableCell sx={{ color: "#e8e8e8", fontWeight: 500 }}>
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
                  </TableCell>
                  <TableCell sx={{ color: "#888888" }}>{u.email}</TableCell>
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
                        }}
                      />
                    ) : (
                      <Select
                        size="small"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        sx={selectStyle}
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
                    <IconButton
                      size="small"
                      onClick={() => onViewDetails(u)}
                      sx={{
                        color: "#888888",
                        "&:hover": {
                          color: "#6c63ff",
                          backgroundColor: "rgba(108,99,255,0.08)",
                        },
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
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
    </>
  );
}