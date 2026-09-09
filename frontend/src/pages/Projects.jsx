import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoadData } from '../hooks/useLoadData.js';
import { useToast } from '../hooks/useToast.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProjectCard from '../components/projects/ProjectCard.jsx';
import ProjectFormModal from '../components/projects/ProjectFormModal.jsx';
import ProjectDetailsModal from '../components/projects/ProjectDetailsModal.jsx';
import ConfirmationDialog from '../components/common/ConfirmationDialog.jsx';
import { hasRole } from '../utils/permissions.js';
import api from '../api/axios.js';

export default function Projects() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({
    open: false,
    editing: null,
  });
  const [detailsState, setDetailsState] = useState({
    open: false,
    project: null,
  });
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const projectsRes = await api.get('/projects');
      const projects = projectsRes.data?.success ? projectsRes.data.data : projectsRes.data || [];

      let users = [];
      try {
        const usersRes = await api.get('/users/public');
        users = usersRes.data?.success ? usersRes.data.data : usersRes.data || [];
      } catch (err) {
        try {
          const usersRes = await api.get('/users/assignable');
          users = usersRes.data?.success ? usersRes.data.data : usersRes.data || [];
        } catch (e) {}
      }

      let teams = [];
      try {
        const teamsRes = await api.get('/teams');
        teams = teamsRes.data?.success ? teamsRes.data.data : teamsRes.data || [];
      } catch (err) {}

      if (users.length === 0) {
        try {
          const meRes = await api.get('/auth/me');
          const me = meRes.data?.success ? meRes.data.data : meRes.data;
          if (me) {
            users = [me];
          }
        } catch (e) {}
      }

      return { projects, users: users || [], teams: teams || [] };
    } catch (error) {
      try {
        const projectsRes = await api.get('/projects');
        const projects = projectsRes.data?.success ? projectsRes.data.data : projectsRes.data || [];
        return { projects, users: [], teams: [] };
      } catch (e) {
        throw error;
      }
    }
  };

  const { data, loading, error, reload } = useLoadData(
    fetchData,
    [user.id, user.role],
    `projects_data_${user.role}`
  );

  useEffect(() => {
    if (error && error.response?.status !== 403) {
      showError(error);
    }
  }, [error, showError]);

  const handleCreateNew = () => {
    setModalState({ open: true, editing: null });
  };

  const handleEdit = project => {
    setModalState({ open: true, editing: project });
  };

  const handleViewDetails = project => {
    setDetailsState({ open: true, project });
  };

  const handleDelete = async id => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      showSuccess('Project deleted successfully');
      await reload();
      setDeleteId(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete project';
      showError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalClose = () => {
    setModalState({ open: false, editing: null });
  };

  const handleModalSuccess = () => {
    reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: '#d45454' }}>
          {error.response?.status === 403
            ? 'You do not have permission to view projects.'
            : 'Failed to load projects. Please try again.'}
        </Typography>
      </Box>
    );
  }
  if (!data) return null;

  const filteredProjects = data.projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = hasRole(user, ['admin', 'manager']);

  return (
    <Box>
      <PageHeader
        title="Projects"
        actionLabel="New Project"
        onAction={handleCreateNew}
        showAction={canManage}
      >
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </PageHeader>

      {filteredProjects.length === 0 ? (
        <EmptyState message={searchTerm ? 'No matches.' : 'No projects found.'} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 3,
          }}
        >
          {filteredProjects.map(project => {
            const isManager = Number(project.managerId) === Number(user.id);
            const canManageProject =
              user.role === 'admin' || (user.role === 'manager' && isManager);
            const roleBadge = isManager ? 'Manager' : '';

            return (
              <ProjectCard
                key={project.id}
                project={project}
                users={data.users || []}
                teams={data.teams || []}
                onViewDetails={() => handleViewDetails(project)}
                onEdit={() => handleEdit(project)}
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
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        users={data.users || []}
        teams={data.teams || []}
        editingProject={modalState.editing}
      />

      <ProjectDetailsModal
        project={detailsState.project}
        open={detailsState.open}
        onClose={() => setDetailsState({ open: false, project: null })}
        users={data.users || []}
        teams={data.teams || []}
      />

      <ConfirmationDialog
        open={!!deleteId}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone. All associated tasks will also be deleted."
        onConfirm={() => handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete Project"
        cancelText="Cancel"
        confirmColor="error"
        loading={isDeleting}
      />
    </Box>
  );
}
