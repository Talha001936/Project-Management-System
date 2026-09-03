//Note: This component is for the projects page. It fetches and displays projects based on the user's role.
import { useState } from "react";
import { Box } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { useLoadData } from "../hooks/useLoadData.js";
import { useToast } from "../hooks/useToast.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ProjectCard from "../components/projects/ProjectCard.jsx";
import ProjectFormModal from "../components/projects/ProjectFormModal.jsx";
import ProjectDetailsModal from "../components/projects/ProjectDetailsModal.jsx";
import ConfirmationDialog from "../components/common/ConfirmationDialog.jsx";
import { hasValidSession, clearSession } from "../utils/permissions.js";
import api from "../api/axios.js";

const PROJECTS_CACHE_KEY = 'projects_data';

export default function Projects() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState({ open: false, editing: null });
  const [detailsState, setDetailsState] = useState({ open: false, project: null });
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    if (!hasValidSession()) {
      clearSession();
      throw new Error('Session expired');
    }

    try {
      const [projectsRes, usersRes, teamsRes] = await Promise.all([
        api.get("/projects"),
        api.get("/projects/users"),
        api.get("/projects/teams")
      ]);

      return {
        projects: projectsRes.data || [],
        users: usersRes.data || [],
        teams: teamsRes.data || []
      };
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        throw new Error('Session expired');
      }
      throw error;
    }
  };

  const { data, loading, error, reload } = useLoadData(fetchData, [user.id], PROJECTS_CACHE_KEY);

  const handleDelete = async (id) => {
    if (!hasValidSession()) {
      clearSession();
      window.location.href = '/login';
      return;
    }

    try {
      await api.delete(`/projects/${id}`);
      showSuccess('Project deleted successfully', 'Deleted');
      await reload();
      setDeleteId(null);
    } catch (err) {
      if (err.response?.status === 403) {
        showError("You don't have permission to delete this project", 'Permission Denied');
      } else if (err.response?.status === 401) {
        clearSession();
        window.location.href = '/login';
      } else {
        showError(err.response?.data?.message || "Failed to delete project", 'Error');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    if (error.message === 'Session expired') {
      showWarning('Session expired. Please login again.', 'Session Expired');
      return <Box sx={{ color: '#f0a030', p: 2 }}>Session expired. Please <a href="/login">login again</a>.</Box>;
    }
    showError(error);
    return <Box sx={{ color: '#d45454', p: 2 }}>{error}</Box>;
  }
  
  if (!data) return null;

  // Only search filtering - backend already handles role-based filtering
  let filteredProjects = data.projects;
  if (searchTerm.trim()) {
    filteredProjects = filteredProjects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  const canManage = user.role === "admin" || user.role === "manager";

  const handleCreateProject = () => {
    if (!hasValidSession()) {
      clearSession();
      window.location.href = '/login';
      return;
    }
    setModalState({ open: true, editing: null });
  };

  // Helper to check if user is project member (for UI badge only)
  const isProjectMember = (project) => {
    if (Number(project.managerId) === Number(user.id)) return false;
    
    const isIndividualMember = project.individualMembers?.some(
      id => Number(id) === Number(user.id)
    );
    
    const isInTeam = project.teamIds?.some(teamId => {
      const team = data.teams.find(t => Number(t.id) === Number(teamId));
      if (!team) return false;
      return team.members?.some(id => Number(id) === Number(user.id));
    });
    
    return isIndividualMember || isInTeam;
  };

  return (
    <Box>
      <PageHeader
        title="Projects"
        actionLabel="New Project"
        onAction={handleCreateProject}
        showAction={canManage}
      >
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search projects..." />
      </PageHeader>

      {filteredProjects.length === 0 ? (
        <EmptyState 
          message={searchTerm 
            ? "No projects match your search." 
            : "No projects found."} 
        />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
          {filteredProjects.map(project => {
            const isProjectManager = Number(project.managerId) === Number(user.id);
            const isMemberOnly = isProjectMember(project);

            let canManageProject = false;
            if (user.role === "admin") {
              canManageProject = true;
            } else if (user.role === "manager") {
              canManageProject = isProjectManager;
            }

            let roleBadge = "";
            if (isProjectManager) {
              roleBadge = "Manager";
            } else if (isMemberOnly) {
              roleBadge = "Member";
            }

            return (
              <ProjectCard
                key={project.id}
                project={project}
                users={data.users}
                teams={data.teams}
                onViewDetails={() => {
                  if (!hasValidSession()) {
                    clearSession();
                    window.location.href = '/login';
                    return;
                  }
                  setDetailsState({ open: true, project });
                }}
                onEdit={() => {
                  if (!hasValidSession()) {
                    clearSession();
                    window.location.href = '/login';
                    return;
                  }
                  setModalState({ open: true, editing: project });
                }}
                onDelete={() => setDeleteId(project.id)}
                canManage={canManageProject}
                roleBadge={roleBadge}
              />
            );
          })}
        </Box>
      )}

      <ProjectFormModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, editing: null })}
        onSuccess={() => {
        reload();
        const isEditing = modalState.editing !== null;
        showSuccess(
          isEditing ? 'Project updated successfully' : 'Project created successfully',
          isEditing ? 'Updated' : 'Created'
  );
}}
        users={data.users}
        teams={data.teams}
        editingProject={modalState.editing}
      />

      <ProjectDetailsModal
        project={detailsState.project}
        open={detailsState.open}
        onClose={() => setDetailsState({ open: false, project: null })}
        users={data.users}
        teams={data.teams}
      />

      <ConfirmationDialog
        open={!!deleteId}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={() => handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </Box>
  );
}
