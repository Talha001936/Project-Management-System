//Note : This component is for managing teams. It allows users with the "admin" role to create, 
// edit, and delete teams. Users with the "manager" role can view teams but cannot make changes. 
// The component fetches team and user data from the backend and displays it in a table format. 
// It also includes search functionality to filter teams by name.
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Group,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLoadData } from "../../hooks/useLoadData.js";
import { useToast } from "../../hooks/useToast.jsx";
import LoadingSpinner from "../common/LoadingSpinner.jsx";
import EmptyState from "../common/EmptyState.jsx";
import SearchBar from "../common/SearchBar.jsx";
import TeamFormModal from "./TeamFormModal.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import api from "../../api/axios.js";

const TEAMS_CACHE_KEY = 'teams_data';

export default function TeamManagement({ onUpdate }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    const [teamsRes, usersRes] = await Promise.all([
      api.get("/teams"),
      api.get("/users/for-team"),
    ]);
    return { teams: teamsRes.data || [], users: usersRes.data || [] };
  };

  const { data, loading, error, reload } = useLoadData(fetchData, [], TEAMS_CACHE_KEY);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/teams/${id}`);
      showSuccess('Team deleted successfully', 'Deleted');
      await reload();
      onUpdate?.();
      setDeleteId(null);
    } catch (err) {
      console.error("Delete error:", err);
      showError(err.response?.data?.message || "Failed to delete team. Please try again.", 'Error');
    }
  };

  if (loading) return <LoadingSpinner size={40} mt={4} />;
  if (error) {
    showError(error);
    return null;
  }
  if (!data) return null;

  const canManage = user.role === "admin";

  // Only search filtering - backend already handles role-based filtering
  let filteredTeams = data.teams;
  if (searchTerm.trim()) {
    filteredTeams = filteredTeams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const getTeamName = (id) => {
    if (!id) return "Unknown Team";
    const team = data.teams.find(t => Number(t.id) === Number(id));
    return team ? team.name : "Unknown Team";
  };

  const isTeamLeader = (team) => {
    return Number(team.leaderId) === Number(user.id);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Group sx={{ color: "#6c63ff", fontSize: 28 }} />
          <Typography
            variant="h6"
            sx={{
              color: "#e8e8e8",
              fontWeight: 600,
            }}
          >
            Teams
          </Typography>
          <Chip
            label={`${filteredTeams.length} teams`}
            size="small"
            sx={{
              backgroundColor: "rgba(108,99,255,0.12)",
              color: "#6c63ff",
              border: "1px solid rgba(108,99,255,0.25)",
            }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search teams..."
          />
          {canManage ? (
            <Button
              variant="contained"
              size="medium"
              onClick={() => setDialog({ open: true, editing: null })}
            >
              Create Team
            </Button>
          ) : (
            user.role === "manager" && (
              <Typography variant="caption" sx={{ color: "#666666" }}>
                Only admins can create or manage teams.
              </Typography>
            )
          )}
        </Box>
      </Box>

      {!filteredTeams.length ? (
        <EmptyState
          message={
            searchTerm ? "No teams match your search." : "No teams found."
          }
        />
      ) : (
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
                  "Team Name",
                  "Leader",
                  "Members",
                  ...(canManage ? ["Actions"] : []),
                ].map((label) => (
                  <TableCell
                    key={label}
                    sx={{
                      color: "#888888",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeams.map((team) => {
                const leader = data.users.find((u) => Number(u.id) === Number(team.leaderId));
                const members =
                  team.members
                    ?.map((id) => data.users.find((u) => Number(u.id) === Number(id)))
                    .filter(Boolean) || [];
                const isLeader = isTeamLeader(team);

                return (
                  <TableRow
                    key={team.id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(108,99,255,0.04)" },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: isLeader ? "rgba(240,160,48,0.15)" : "rgba(108,99,255,0.15)",
                            width: 32,
                            height: 32,
                            color: isLeader ? "#f0a030" : "#6c63ff",
                          }}
                        >
                          <Group sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography sx={{ color: "#e8e8e8", fontWeight: 500 }}>
                          {team.name}
                          {isLeader && (
                            <Chip
                              size="small"
                              label="Leader"
                              sx={{
                                ml: 1,
                                backgroundColor: "rgba(240,160,48,0.12)",
                                color: "#f0a030",
                                border: "1px solid rgba(240,160,48,0.25)",
                                fontWeight: 600,
                                fontSize: "0.6rem",
                                height: 20,
                              }}
                            />
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={leader?.name || "Unknown"}
                        sx={{
                          backgroundColor: isLeader ? "rgba(240,160,48,0.12)" : "rgba(108,99,255,0.08)",
                          color: isLeader ? "#f0a030" : "#6c63ff",
                          border: isLeader ? "1px solid rgba(240,160,48,0.25)" : "1px solid rgba(108,99,255,0.2)",
                          fontWeight: 500,
                          borderRadius: "6px",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ gap: 0.5 }}
                      >
                        {members.map((m) => (
                          <Chip
                            key={m.id}
                            size="small"
                            label={m.name}
                            sx={{
                              backgroundColor:
                                Number(m.id) === Number(team.leaderId)
                                  ? "rgba(240,160,48,0.12)"
                                  : "rgba(108,99,255,0.05)",
                              color:
                                Number(m.id) === Number(team.leaderId) ? "#f0a030" : "#888888",
                              border:
                                Number(m.id) === Number(team.leaderId)
                                  ? "1px solid rgba(240,160,48,0.25)"
                                  : "1px solid #2a2a2a",
                              borderRadius: "6px",
                              fontSize: "0.7rem",
                              "& .MuiChip-label": { px: 1.5 },
                            }}
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setDialog({ open: true, editing: team })
                          }
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
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(team.id)}
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(212,84,84,0.08)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      <TeamFormModal
        open={dialog.open}
        onClose={() => setDialog({ open: false, editing: null })}
        onSuccess={() => {
          reload();
          onUpdate?.();
          showSuccess('Team updated successfully', 'Updated');
        }}
        editingTeam={dialog.editing}
        users={data.users}
      />

      <ConfirmationDialog
        open={!!deleteId}
        title="Delete Team"
        message={`Are you sure you want to delete "${getTeamName(deleteId)}"?\n\nThis action cannot be undone. All team members will be removed from this team.`}
        onConfirm={() => handleDelete(deleteId)}
        onCancel={() => {
          setDeleteId(null);
        }}
        confirmText="Delete Team"
        cancelText="Cancel"
        confirmColor="error"
      />
    </Box>
  );
}