// Note: This file is used to manage projects. It fetches project data, displays it 
// in a grid of cards, and provides modals for adding/editing projects and viewing 
// project details, all of which happen using reusable components.
import { useState } from "react";
import { Box, Grid, Alert } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { useLoadData } from "../hooks/useLoadData.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ProjectCard from "../components/projects/ProjectCard.jsx";
import ProjectFormModal from "../components/projects/ProjectFormModal.jsx";
import ProjectDetailsModal from "../components/projects/ProjectDetailsModal.jsx";
import ConfirmationDialog from "../components/common/ConfirmationDialog.jsx";
import api from "../api/axios.js";

export default function Projects() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState({ open: false, editing: null });
  const [detailsState, setDetailsState] = useState({ open: false, project: null });
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    const [projectsRes, usersRes, teamsRes] = await Promise.all([
      api.get("/projects"),
      api.get("/projects/all-users"),
      api.get("/projects/all-teams")
    ]);
    return { projects: projectsRes.data, users: usersRes.data, teams: teamsRes.data };
  };

  const { data, loading, error, reload } = useLoadData(fetchData, []);

  const handleDelete = async (id) => {
    try { await api.delete(`/projects/${id}`); await reload(); setDeleteId(null); } catch (err) {}
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  let filteredProjects = data.projects;

  if (user.role === "employee") {
   
    filteredProjects = data.projects.filter(p => {
      const inAssignedTeam = p.teamIds?.some(teamId => {
        const team = data.teams.find(t => Number(t.id) === Number(teamId));
        return team?.members?.some(id => Number(id) === Number(user.id));
      });
      
      return inAssignedTeam || 
             p.individualMembers?.some(id => Number(id) === Number(user.id)) ||
             Number(p.managerId) === Number(user.id);
    });
  } else if (user.role === "manager") {
    filteredProjects = data.projects.filter(p => {
      const isProjectManager = Number(p.managerId) === Number(user.id);
      const isIndividualMember = p.individualMembers?.some(id => Number(id) === Number(user.id));
      const isInTeam = p.teamIds?.some(teamId => {
        const team = data.teams.find(t => Number(t.id) === Number(teamId));
        return team?.members?.some(id => Number(id) === Number(user.id));
      });
      
      return isProjectManager || isIndividualMember || isInTeam;
    });
  }
 

  if (searchTerm.trim()) {
    filteredProjects = filteredProjects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  const canManage = user.role === "admin" || user.role === "manager";
  const emptyMsg = searchTerm ? "No projects match your search." :
    user.role === "employee" ? "You are not assigned to any projects yet." :
    user.role === "manager" ? "You are not part of any projects." :
    "No projects created yet. Create one to get started.";

  return (
    <Box>
      <PageHeader title="Projects" actionLabel="New Project" onAction={() => setModalState({ open: true, editing: null })} showAction={canManage}>
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search projects..." />
      </PageHeader>
      
      {filteredProjects.length === 0 ? <EmptyState message={emptyMsg} /> : (
        <Grid container spacing={2}>
          {filteredProjects.map(p => {
            const isProjectManager = Number(p.managerId) === Number(user.id);
            return (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <ProjectCard
                  project={p}
                  users={data.users}
                  teams={data.teams}
                  onViewDetails={() => setDetailsState({ open: true, project: p })}
                  onEdit={() => setModalState({ open: true, editing: p })}
                  onDelete={() => setDeleteId(p.id)}
                  canManage={canManage && (user.role === "admin" || isProjectManager)}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
      
      <ProjectFormModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, editing: null })}
        onSuccess={reload}
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