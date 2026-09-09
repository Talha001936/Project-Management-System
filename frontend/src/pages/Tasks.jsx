import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoadData } from '../hooks/useLoadData.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import TaskTable from '../components/tasks/TaskTable.jsx';
import TaskFormModal from '../components/tasks/TaskFormModal.jsx';
import TaskDetailsModal from '../components/tasks/TaskDetailsModal.jsx';
import ConfirmationDialog from '../components/common/ConfirmationDialog.jsx';
import { hasRole } from '../utils/permissions.js';
import api from '../api/axios.js';
import { useToast } from '../hooks/useToast.jsx';

export default function Tasks() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({
    open: false,
    editing: null,
  });
  const [detailsState, setDetailsState] = useState({
    open: false,
    task: null,
  });
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    const requests = [api.get('/tasks')];
    requests.push(api.get('/projects'));

    if (user.role === 'admin') {
      requests.push(api.get('/users'));
    } else {
      requests.push(api.get('/users/assignable'));
    }

    if (user.role === 'admin' || user.role === 'manager') {
      requests.push(api.get('/teams'));
    } else {
      requests.push(Promise.resolve({ data: { data: [] } }));
    }

    const responses = await Promise.all(requests);

    const tasks = responses[0].data?.success ? responses[0].data.data : responses[0].data || [];
    const projects = responses[1].data?.success ? responses[1].data.data : responses[1].data || [];
    const users = responses[2].data?.success ? responses[2].data.data : responses[2].data || [];
    const teams = responses[3].data?.success ? responses[3].data.data : responses[3].data || [];

    return { tasks, projects, users, teams };
  };

  const { data, loading, error, reload } = useLoadData(
    fetchData,
    [user.id, user.role],
    `tasks_data_${user.role}`
  );

  useEffect(() => {
    if (error && error.response?.status !== 403) {
      showError(error);
    }
  }, [error, showError]);

  const handleCreateNew = () => {
    setModalState({ open: true, editing: null });
  };

  const handleEdit = task => {
    setModalState({ open: true, editing: task });
  };

  const handleViewDetails = task => {
    setDetailsState({ open: true, task });
  };

  const handleDelete = async id => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${id}`);
      showSuccess('Task deleted successfully');
      await reload();
      setDeleteId(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete task';
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
            ? 'You do not have permission to view tasks.'
            : 'Failed to load tasks. Please try again.'}
        </Typography>
      </Box>
    );
  }
  if (!data) return null;

  const filteredTasks = data.tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateTasks = user.role === 'admin' || user.role === 'manager';

  return (
    <Box>
      <PageHeader
        title={user.role === 'employee' ? 'My Tasks' : 'Tasks'}
        actionLabel="New Task"
        onAction={handleCreateNew}
        showAction={canCreateTasks}
      >
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </PageHeader>

      {filteredTasks.length === 0 ? (
        <EmptyState message={searchTerm ? 'No matches.' : 'No tasks found.'} />
      ) : (
        <TaskTable
          tasks={filteredTasks}
          projects={data.projects}
          users={data.users}
          teams={data.teams}
          currentUser={user}
          onViewDetails={handleViewDetails}
          onStatusUpdate={reload}
          onEdit={handleEdit}
          onDelete={setDeleteId}
        />
      )}

      <TaskFormModal
        open={modalState.open}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        projects={data.projects}
        users={data.users}
        teams={data.teams}
        editingTask={modalState.editing}
      />

      <TaskDetailsModal
        task={detailsState.task}
        open={detailsState.open}
        onClose={() => setDetailsState({ open: false, task: null })}
        onUpdate={reload}
        users={data.users}
        projects={data.projects}
      />

      <ConfirmationDialog
        open={!!deleteId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={() => handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete Task"
        cancelText="Cancel"
        confirmColor="error"
        loading={isDeleting}
      />
    </Box>
  );
}
