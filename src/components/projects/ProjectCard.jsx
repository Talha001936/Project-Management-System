// Note: This file is a project card component for the application. It displays project 
// information. It also provides buttons for viewing details, editing, and deleting 
// the project based on user permissions.
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const getMemberName = (id, users) =>
  users?.find((u) => Number(u.id) === Number(id))?.name ||
  (id ? `User #${id}` : "Unassigned");
const getTeamName = (id, teams) =>
  teams?.find((t) => Number(t.id) === Number(id))?.name ||
  (id ? `Team #${id}` : "No team");

export default function ProjectCard({
  project,
  users,
  teams,
  onViewDetails,
  onEdit,
  onDelete,
  canManage,
}) {
  const getAllMembers = () => {
    const members = new Set();
    if (project.managerId) members.add(Number(project.managerId));
    project.individualMembers?.forEach((id) => members.add(Number(id)));
    project.teamIds?.forEach((id) => {
      const team = teams.find((t) => Number(t.id) === Number(id));
      team?.members?.forEach((mid) => members.add(Number(mid)));
    });
    return Array.from(members);
  };

  const statusStyles =
    {
      active: {
        bg: "rgba(108,99,255,0.12)",
        color: "#6c63ff",
        border: "1px solid rgba(108,99,255,0.25)",
      },
      completed: {
        bg: "rgba(74,158,74,0.12)",
        color: "#4a9e4a",
        border: "1px solid rgba(74,158,74,0.25)",
      },
      archived: {
        bg: "rgba(102,102,102,0.12)",
        color: "#666666",
        border: "1px solid rgba(102,102,102,0.2)",
      },
    }[project.status || "active"] || statusStyles.active;

  const allMembers = getAllMembers();


  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(project.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: "1px solid #2a2a2a",
        backgroundColor: "#1a1a1a",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              color: "#e8e8e8",
              fontSize: "1.1rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "60%",
            }}
          >
            {project.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip
              label={project.status || "active"}
              size="small"
              sx={{
                backgroundColor: statusStyles.bg,
                color: statusStyles.color,
                fontWeight: 500,
                border: statusStyles.border,
              }}
            />
            {canManage && (
              <>
                <IconButton
                  size="small"
                  onClick={handleEdit}
                  sx={{ color: "#888888", "&:hover": { color: "#6c63ff" } }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  sx={{ color: "#888888", "&:hover": { color: "#d45454" } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: "#888888",
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "40px",
          }}
        >
          {project.description || "No description"}
        </Typography>
        <Divider sx={{ borderColor: "#2a2a2a", mb: 2 }} />

        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ color: "#666666", fontWeight: 500 }}
          >
            Manager
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#e8e8e8", fontWeight: 500 }}
          >
            {getMemberName(project.managerId, users)}
          </Typography>
        </Box>

        {!!project.teamIds?.length && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ color: "#666666", fontWeight: 500 }}
            >
              Teams
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 0.5 }}
            >
              {project.teamIds.map((id) => (
                <Chip
                  key={id}
                  size="small"
                  label={getTeamName(id, teams)}
                  sx={{
                    backgroundColor: "rgba(108,99,255,0.08)",
                    color: "#6c63ff",
                    border: "1px solid rgba(108,99,255,0.2)",
                    fontSize: "0.7rem",
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {!!allMembers.length && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: "#666666", fontWeight: 500 }}
            >
              Members ({allMembers.length})
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 0.5 }}
            >
              {allMembers.map((m) => (
                <Chip
                  key={m}
                  size="small"
                  label={getMemberName(m, users)}
                  variant={
                    Number(m) === Number(project.managerId)
                      ? "filled"
                      : "outlined"
                  }
                  sx={{
                    backgroundColor:
                      Number(m) === Number(project.managerId)
                        ? "rgba(108,99,255,0.12)"
                        : "transparent",
                    color:
                      Number(m) === Number(project.managerId)
                        ? "#6c63ff"
                        : "#888888",
                    border:
                      Number(m) === Number(project.managerId)
                        ? "1px solid rgba(108,99,255,0.25)"
                        : "1px solid #2a2a2a",
                    fontSize: "0.7rem",
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={handleViewDetails}
          fullWidth
          variant="outlined"
          sx={{
            color: "#6c63ff",
            borderColor: "#2a2a2a",
            borderRadius: 1.5,
            py: 0.8,
            "&:hover": {
              borderColor: "#6c63ff",
              backgroundColor: "rgba(108,99,255,0.06)",
            },
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}