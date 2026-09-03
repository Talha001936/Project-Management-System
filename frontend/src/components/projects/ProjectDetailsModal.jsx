// Note: This file is a project details modal component for the application. 
// It displays detailed information about a project.It also provides a close button to dismiss the modal.
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, Stack, Box, Divider } from "@mui/material";
import { StatusChip } from "../common/StatusChip.jsx";

const getUserName = (id, users) => {
  if (!id) return "Unassigned";
  const user = users.find(u => Number(u.id) === Number(id));
  return user?.name || `User #${id}`;
};

const getTeamName = (id, teams) => {
  if (!id) return "No team";
  const team = teams.find(t => Number(t.id) === Number(id));
  return team?.name || `Team #${id}`;
};

export default function ProjectDetailsModal({ project, open, onClose, users, teams }) {
  if (!project) return null;

  const getAllMembers = () => {
    const members = new Set();
    if (project.managerId) members.add(Number(project.managerId));
    project.individualMembers?.forEach((id) => members.add(Number(id)));
    project.teamIds?.forEach((teamId) => {
      const team = teams.find((t) => Number(t.id) === Number(teamId));
      team?.members?.forEach((id) => members.add(Number(id)));
    });
    return Array.from(members);
  };

  const allMembers = getAllMembers();

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
              value: getUserName(project.createdBy, users),
            },
            { label: "Manager", value: getUserName(project.managerId, users) },
            ...(project.teamIds?.length > 0
              ? [
                  {
                    label: "Assigned Teams",
                    value: project.teamIds.map((id) => (
                      <Chip
                        key={id}
                        size="small"
                        label={getTeamName(id, teams)}
                        sx={{
                          backgroundColor: "rgba(108,99,255,0.12)",
                          color: "#6c63ff",
                          border: "1px solid rgba(108,99,255,0.25)",
                          borderRadius: "6px",
                          fontWeight: 500,
                          fontSize: "0.7rem",
                        }}
                      />
                    )),
                  },
                ]
              : []),
            ...(allMembers.length > 0
              ? [
                  {
                    label: `All Members (${allMembers.length})`,
                    value: allMembers.map((id) => {
                      const isManager = Number(id) === Number(project.managerId);
                      return (
                        <Chip
                          key={id}
                          size="small"
                          label={getUserName(id, users)}
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
              value: new Date(project.createdAt).toLocaleDateString(),
            },
            ...(project.updatedAt
              ? [
                  {
                    label: "Updated At",
                    value: new Date(project.updatedAt).toLocaleDateString(),
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