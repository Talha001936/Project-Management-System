//Note: This component is for the tasks page. It fetches and displays tasks based on the user's role.
import { useState } from "react";
import { Box } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { useLoadData } from "../hooks/useLoadData.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import TaskTable from "../components/tasks/TaskTable.jsx";
import TaskFormModal from "../components/tasks/TaskFormModal.jsx";
import TaskDetailsModal from "../components/tasks/TaskDetailsModal.jsx";
import ConfirmationDialog from "../components/common/ConfirmationDialog.jsx";
import { hasValidSession, clearSession } from "../utils/permissions.js";
import api from "../api/axios.js";
import { useToast } from "../hooks/useToast.jsx";

const TASKS_CACHE_KEY = 'tasks_data';

export default function Tasks() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState({ open: false, editing: null });
  const [detailsState, setDetailsState] = useState({ open: false, task: null });
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    if (!hasValidSession()) {
      clearSession();
      throw new Error('Session expired');
    }

    try {
      const [tasksRes, projectsRes, usersRes, teamsRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/projects"),
        api.get("/projects/users"),
        api.get("/projects/teams")
      ]);

      return {
        tasks: tasksRes.data || [],
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

  const { data, loading, error, reload } = useLoadData(fetchData, [user.id], TASKS_CACHE_KEY);

  const handleDelete = async (id) => {
    if (!hasValidSession()) {
      clearSession();
      window.location.href = '/login';
      return;
    }

    try {
      await api.delete(`/tasks/${id}`);
      showSuccess("Task deleted successfully");
      await reload();
      setDeleteId(null);
    } catch (err) {
      if (err.response?.status === 403) {
        showError("You don't have permission to delete this task");
      } else {
        showError(err.response?.data?.message || "Failed to delete task");
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
  let filteredTasks = data.tasks;
  if (searchTerm.trim()) {
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // Determine if user can create tasks
  const canCreate = (() => {
    if (user.role === "admin") return true;
    if (user.role === "manager") {
      const managedProjectIds = data.projects
        .filter(p => Number(p.managerId) === Number(user.id))
        .map(p => p.id);
      return managedProjectIds.length > 0;
    }
    return false;
  })();

  const handleCreateTask = () => {
    if (!hasValidSession()) {
      clearSession();
      window.location.href = '/login';
      return;
    }
    setModalState({ open: true, editing: null });
  };

  const getEmptyMessage = () => {
    if (searchTerm) return "No tasks match your search.";
    return "No tasks found.";
  };

  return (
    <Box>
      <PageHeader
        title={user.role === "employee" ? "My Tasks" : "Tasks"}
        actionLabel="New Task"
        onAction={handleCreateTask}
        showAction={canCreate}
      >
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search tasks..." />
      </PageHeader>

      {filteredTasks.length === 0 ? (
        <EmptyState message={getEmptyMessage()} />
      ) : (
        <TaskTable
          tasks={filteredTasks}
          projects={data.projects}
          users={data.users}
          currentUser={user}
          onViewDetails={(task) => {
            if (!hasValidSession()) {
              clearSession();
              window.location.href = '/login';
              return;
            }
            setDetailsState({ open: true, task });
          }}
          onStatusUpdate={reload}
          onEdit={(task) => {
            if (!hasValidSession()) {
              clearSession();
              window.location.href = '/login';
              return;
            }
            setModalState({ open: true, editing: task });
          }}
          onDelete={setDeleteId}
        />
      )}

      <TaskFormModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, editing: null })}
        onSuccess={reload}
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
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </Box>
  );
}