// frontend/src/components/projects/ProjectDetailsModal.jsx
import { useState, useEffect } from "react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Chip, Stack, Box, Divider, CircularProgress 
} from "@mui/material";
import { StatusChip } from "../common/StatusChip.jsx";
import { getUserName, getTeamName, formatDate } from "../../utils/helpers.js";
import api from "../../api/axios.js";

export default function ProjectDetailsModal({ project, open, onClose, users, teams }) {
  const [projectUsers, setProjectUsers] = useState([]);
  const [projectTeams, setProjectTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && project) {
      const fetchProjectDetails = async () => {
        setLoading(true);
        try {
          const [usersRes, teamsRes] = await Promise.all([
            api.get(`/projects/${project.id}/users`),
            api.get(`/projects/${project.id}/teams`)
          ]);
          
          const fetchedUsers = usersRes.data?.success ? usersRes.data.data : usersRes.data || [];
          const fetchedTeams = teamsRes.data?.success ? teamsRes.data.data : teamsRes.data || [];
          
          setProjectUsers(fetchedUsers);
          setProjectTeams(fetchedTeams);
        } catch (error) {
          console.error('Failed to fetch project details:', error);
          // Fallback: calculate from props
          const allMembers = new Set();
          if (project.individualMembers) {
            project.individualMembers.forEach(id => allMembers.add(Number(id)));
          }
          if (project.teamIds) {
            project.teamIds.forEach(teamId => {
              const team = teams.find(t => Number(t.id) === Number(teamId));
              if (team?.members) {
                team.members.forEach(id => allMembers.add(Number(id)));
              }
            });
          }
          if (project.managerId) {
            allMembers.add(Number(project.managerId));
          }
          
          const memberUsers = Array.from(allMembers)
            .map(id => users.find(u => Number(u.id) === Number(id)))
            .filter(Boolean);
          setProjectUsers(memberUsers);
          const teamObjects = (project.teamIds || [])
            .map(id => teams.find(t => Number(t.id) === Number(id)))
            .filter(Boolean);
          setProjectTeams(teamObjects);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProjectDetails();
    }
  }, [project, open, users, teams]);

  if (!project) return null;

  // Use fetched data or fallback
  const members = projectUsers.length > 0 ? projectUsers : [];
  const teamData = projectTeams.length > 0 ? projectTeams : [];

  
  const createdByName = getUserName(project.createdBy, users);

  return (
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
            {project.name}
          </Typography>
          <StatusChip status={project.status || "active"} />
        </Box>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ borderColor: "#2a2a2a", pt: 3, backgroundColor: "#1a1a1a" }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#6c63ff" }} />
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: "#8888887d", mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ color: "#888888", mb: 3 }}>
              {project.description || "No description provided"}
            </Typography>
            <Divider sx={{ borderColor: "#2a2a2a", mb: 3 }} />
            <Stack spacing={2.5}>
              {[
                {
                  label: "Created By",
                  value: createdByName,
                },
                { 
                  label: "Manager", 
                  value: getUserName(project.managerId, users) 
                },
                ...(project.teamIds && project.teamIds.length > 0
                  ? [
                      {
                        label: "Assigned Teams",
                        value: project.teamIds.map((id) => {

                          const team = teams.find(t => Number(t.id) === Number(id)) || 
                                      teamData.find(t => Number(t.id) === Number(id));
                          const teamName = team?.name || getTeamName(id, teams);
                          return (
                            <Chip
                              key={id}
                              size="small"
                              label={teamName}
                              sx={{
                                backgroundColor: "rgba(108,99,255,0.12)",
                                color: "#6c63ff",
                                border: "1px solid rgba(108,99,255,0.25)",
                                borderRadius: "6px",
                                fontWeight: 500,
                                fontSize: "0.7rem",
                              }}
                            />
                          );
                        }),
                      },
                    ]
                  : []),
                ...(members.length > 0
                  ? [
                      {
                        label: `All Members (${members.length})`,
                        value: members.map((member) => {
                          const memberId = member.id;
                          const memberName = member.name || getUserName(memberId, users);
                          const isManager = Number(memberId) === Number(project.managerId);
                          return (
                            <Chip
                              key={memberId}
                              size="small"
                              label={memberName}
                              sx={{
                                backgroundColor: isManager
                                  ? "rgba(108,99,255,0.15)"
                                  : "rgba(108,99,255,0.05)",
                                color: isManager ? "#6c63ff" : "#888888",
                                border: isManager
                                  ? "1px solid rgba(108,99,255,0.25)"
                                  : "1px solid #2a2a2a",
                                borderRadius: "6px",
                                fontWeight: isManager ? 600 : 400,
                                fontSize: "0.7rem",
                              }}
                            />
                          );
                        }),
                      },
                    ]
                  : []),
                {
                  label: "Created At",
                  value: formatDate(project.createdAt),
                },
                ...(project.updatedAt && project.updatedAt !== project.createdAt
                  ? [
                      {
                        label: "Updated At",
                        value: formatDate(project.updatedAt),
                      },
                    ]
                  : []),
              ].map((item, idx) => (
                <Box key={idx}>
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
                    {item.label}
                  </Typography>
                  {typeof item.value === "string" ? (
                    <Typography
                      variant="body2"
                      sx={{ color: idx === 0 || idx === 1 ? "#e8e8e8" : "#888888" }}
                    >
                      {item.value}
                    </Typography>
                  ) : (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ gap: 0.5, mt: 0.5 }}
                    >
                      {item.value}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </>
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
  );
}
