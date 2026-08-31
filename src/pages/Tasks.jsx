// Note: This file is used to manage tasks. It fetches task data, displays 
// it in a table, and provides modals for adding/editing tasks and viewing 
// task details, all of which happen using reusable components.
import { useState } from "react";
import { Box, Alert } from "@mui/material";
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
import api from "../api/axios.js";

export default function Tasks() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState({ open: false, editing: null });
  const [detailsState, setDetailsState] = useState({ open: false, task: null });
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, usersRes, teamsRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/projects"),
        api.get("/projects/all-users"),
        api.get("/projects/all-teams")
      ]);
      
      return { 
        tasks: tasksRes.data || [], 
        projects: projectsRes.data || [], 
        users: usersRes.data || [], 
        teams: teamsRes.data || [] 
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

  const { data, loading, error, reload } = useLoadData(fetchData, []);

  const handleDelete = async (id) => {
    try { 
      await api.delete(`/tasks/${id}`); 
      await reload(); 
      setDeleteId(null); 
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEdit = (task) => {
    setModalState({ open: true, editing: task });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  let filteredTasks = data.tasks;

  if (user.role === "employee") {
   
    filteredTasks = data.tasks.filter(t => Number(t.assigneeId) === Number(user.id));
  } else if (user.role === "manager") {
    
    const managedProjectIds = data.projects
      .filter(p => Number(p.managerId) === Number(user.id))
      .map(p => p.id);
    
   
    const memberProjectIds = data.projects
      .filter(p => {
        const isProjectManager = Number(p.managerId) === Number(user.id);
        if (isProjectManager) return false;
        
        const isIndividualMember = p.individualMembers?.some(id => Number(id) === Number(user.id));
        const isInTeam = p.teamIds?.some(teamId => {
          const team = data.teams.find(t => Number(t.id) === Number(teamId));
          return team?.members?.some(id => Number(id) === Number(user.id));
        });
        return isIndividualMember || isInTeam;
      })
      .map(p => p.id);
    
  
    filteredTasks = data.tasks.filter(t => {
      const isManagedProject = managedProjectIds.includes(Number(t.projectId));
      const isAssignedToManager = Number(t.assigneeId) === Number(user.id);
      const isMemberProject = memberProjectIds.includes(Number(t.projectId));
      
      // If it's a managed project, show all tasks
      if (isManagedProject) return true;
      
      // If it's a member project, only show tasks assigned to the manager
      if (isMemberProject && isAssignedToManager) return true;
      
      return false;
    });
  }
  // Admin sees all tasks

  if (searchTerm.trim()) {
    filteredTasks = filteredTasks.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  
  const managedProjectIds = data.projects
    .filter(p => Number(p.managerId) === Number(user.id))
    .map(p => p.id);
  const canCreate = user.role === "admin" || 
    (user.role === "manager" && managedProjectIds.length > 0);
  
  const emptyMsg = searchTerm ? "No tasks match your search." :
    user.role === "employee" ? "You have no tasks assigned yet." :
    user.role === "manager" ? "You have no tasks in projects you manage or are assigned to." :
    "No tasks yet — create one to get started.";

  return (
    <Box>
      <PageHeader 
        title={user.role === "employee" ? "My Tasks" : "Tasks"} 
        actionLabel="New Task" 
        onAction={() => setModalState({ open: true, editing: null })} 
        showAction={canCreate}
      >
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search tasks..." />
      </PageHeader>
      
      {filteredTasks.length === 0 ? <EmptyState message={emptyMsg} /> : (
        <TaskTable 
          tasks={filteredTasks} 
          projects={data.projects} 
          users={data.users} 
          currentUser={user}
          onViewDetails={task => setDetailsState({ open: true, task })}
          onStatusUpdate={reload}
          onEdit={handleEdit}
          onDelete={setDeleteId}
        />
      )}
      
      <TaskFormModal 
        open={modalState.open} 
        onClose={() => setModalState({ open: false, editing: null })} 
        onSuccess={() => { 
          reload(); 
          setModalState({ open: false, editing: null }); 
        }}
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