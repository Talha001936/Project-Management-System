// src/pages/Dashboard.jsx
import { Box, Grid, Typography, Card, CardContent, Alert } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { useLoadData } from "../hooks/useLoadData.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import api from "../api/axios.js";

export default function Dashboard() {
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    const [projectsRes, tasksRes, usersRes, teamsRes] = await Promise.all([
      api.get("/projects"),
      api.get("/tasks"),
      api.get("/projects/all-users"),
      api.get("/projects/all-teams")
    ]);
    return {
      projects: projectsRes.data,
      tasks: tasksRes.data,
      users: usersRes.data,
      teams: teamsRes.data
    };
  };

  const { data, loading, error } = useLoadData(fetchDashboardData, [user.role]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  // Helper to check if user is in a team (same as Projects.jsx)
  const isUserInTeam = (team, userId) => {
    return team?.members?.some(id => Number(id) === Number(userId)) ||
           Number(team?.leaderId) === Number(userId);
  };

  let stats = [];
  
  let filteredProjects = [];
  let filteredTasks = [];

  if (user.role === "employee") {
    // Same logic as Projects.jsx for employee
    filteredProjects = data.projects.filter(p => {
      const inAssignedTeam = p.teamIds?.some(teamId => {
        const team = data.teams.find(t => Number(t.id) === Number(teamId));
        return team && isUserInTeam(team, user.id);
      });
      
      return inAssignedTeam || 
             p.individualMembers?.some(id => Number(id) === Number(user.id)) ||
             Number(p.managerId) === Number(user.id);
    });
    
    filteredTasks = data.tasks.filter(t => Number(t.assigneeId) === Number(user.id));
    
    const doneTasks = filteredTasks.filter(t => t.status === "done").length;
    const inProgressTasks = filteredTasks.filter(t => t.status === "in-progress" || t.status === "review").length;
   
    
    stats = [
      { label: "My Projects", value: filteredProjects.length },
      { label: "My Tasks", value: filteredTasks.length },
      { label: "Completed Tasks", value: doneTasks },
      { label: "In Progress", value: inProgressTasks }
    ];
  } else if (user.role === "manager") {
    // EXACT SAME LOGIC as Projects.jsx for manager
    filteredProjects = data.projects.filter(p => {
      const isProjectManager = Number(p.managerId) === Number(user.id);
      const isIndividualMember = p.individualMembers?.some(id => Number(id) === Number(user.id));
      const isInTeam = p.teamIds?.some(teamId => {
        const team = data.teams.find(t => Number(t.id) === Number(teamId));
        return team && isUserInTeam(team, user.id);
      });
      
      return isProjectManager || isIndividualMember || isInTeam;
    });
    
    // Get project IDs where manager is the Project Manager
    const managedProjectIds = data.projects
      .filter(p => Number(p.managerId) === Number(user.id))
      .map(p => p.id);
    
    // Get project IDs where manager is just a member (not the manager)
    const memberProjectIds = data.projects
      .filter(p => {
        const isProjectManager = Number(p.managerId) === Number(user.id);
        if (isProjectManager) return false;
        
        const isIndividualMember = p.individualMembers?.some(id => Number(id) === Number(user.id));
        const isInTeam = p.teamIds?.some(teamId => {
          const team = data.teams.find(t => Number(t.id) === Number(teamId));
          return team && isUserInTeam(team, user.id);
        });
        return isIndividualMember || isInTeam;
      })
      .map(p => p.id);
    
    
    filteredTasks = data.tasks.filter(t => {
      const isManagedProject = managedProjectIds.includes(Number(t.projectId));
      const isAssignedToManager = Number(t.assigneeId) === Number(user.id);
      const isMemberProject = memberProjectIds.includes(Number(t.projectId));
      
      // If manager manage the project, show all tasks
      if (isManagedProject) return true;
      
      // If manager is just a member of the project, only show tasks assigned to the manager
      if (isMemberProject && isAssignedToManager) return true;
      
      return false;
    });
    
    // Count tasks for stats
    const managedTasks = data.tasks.filter(t => managedProjectIds.includes(Number(t.projectId)));
    const managedDoneTasks = managedTasks.filter(t => t.status === "done").length;
   
    
    // Count tasks assigned to manager 
    const tasksAssignedToManager = filteredTasks.filter(t => Number(t.assigneeId) === Number(user.id));
    
    // Count managed projects vs member projects
    const managedProjects = data.projects.filter(p => Number(p.managerId) === Number(user.id));
    const memberProjects = data.projects.filter(p => {
      const isProjectManager = Number(p.managerId) === Number(user.id);
      if (isProjectManager) return false;
      
      const isIndividualMember = p.individualMembers?.some(id => Number(id) === Number(user.id));
      const isInTeam = p.teamIds?.some(teamId => {
        const team = data.teams.find(t => Number(t.id) === Number(teamId));
        return team && isUserInTeam(team, user.id);
      });
      return isIndividualMember || isInTeam;
    });
    
    stats = [
      { label: "Managed Projects", value: managedProjects.length },
      { label: "Projects I'm In", value: memberProjects.length-1 },
      { label: "Total Tasks", value: filteredTasks.length },
      { label: "My Tasks", value: tasksAssignedToManager.length }
    ];
  } else if (user.role === "admin") {
    // Admin sees all
    filteredProjects = data.projects;
    filteredTasks = data.tasks;
    
    const doneTasks = filteredTasks.filter(t => t.status === "done").length;
   
    stats = [
      { label: "Total Projects", value: filteredProjects.length },
      { label: "Total Tasks", value: filteredTasks.length },
      { label: "Total Teams", value: data.teams?.length || 0 },
      { label: "Total Users", value: data.users?.length || 0 }
    ];
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#e8e8e8" }}>
        Welcome back, {user.name.split(" ")[0]}
      </Typography>
      <Typography variant="body2" color="text.secondary" textTransform="capitalize">
        {user.role} Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {stats.map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ 
              borderRadius: 3,
              border: "1px solid #2a2a2a",
              bgcolor: "#1a1a1a",
              transition: "transform 0.2s",
              '&:hover': { transform: "translateY(-4px)" }
            }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: "#6c63ff" }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

    </Box>
  );
}