import { Box, Grid, Typography, Card, CardContent } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { useLoadData } from "../hooks/useLoadData.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import api from "../api/axios.js";
import { useToast } from "../hooks/useToast.jsx";
import { hasValidSession, clearSession } from "../utils/permissions.js";

export default function Dashboard() {
  const { user } = useAuth();
  const { showWarning, showError } = useToast();

  const fetchDashboardData = async () => {
    if (!hasValidSession()) {
      clearSession();
      throw new Error('Session expired');
    }

    try {
      const [projectsRes, tasksRes, usersRes, teamsRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/projects/users"),
        api.get("/projects/teams")
      ]);

      return {
        projects: projectsRes.data || [],
        tasks: tasksRes.data || [],
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

  const { data, loading, error } = useLoadData(
    fetchDashboardData, 
    [user.id], 
    'dashboard_data'
  );

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    if (error === 'Session expired') {
      showWarning('Session expired. Please login again.', 'Session Expired');
      return <Typography sx={{ color: '#f0a030' }}>Session expired. Please <a href="/login">login again</a>.</Typography>;
    }
    showError(error);
    return <Typography sx={{ color: '#d45454' }}>{error}</Typography>;
  }
  
  if (!data) return null;

  // Backend already filters data by role - use directly
  const projects = data.projects;
  const tasks = data.tasks;
  const users = data.users;

  let stats = [];

  if (user.role === "admin") {
    const completedTasks = tasks.filter(t => t.status === "done").length;
    const activeUsers = users.filter(u => u.active !== false).length;

    stats = [
      { label: "Total Projects", value: projects.length, color: "#8d877e" },
      { label: "Total Tasks", value: tasks.length, color: "#8d877e" },
      { label: "Completed Tasks", value: completedTasks, color: "#8d877e" },
      { label: "Active Users", value: activeUsers, color: "#8d877e" }
    ];
    
  } else if (user.role === "manager") {
    // Projects where manager is the actual manager
    const managedProjects = projects.filter(p => Number(p.managerId) === Number(user.id));
    
    // Projects where manager is just a member (not the manager)
    const memberProjects = projects.filter(p => {
      if (Number(p.managerId) === Number(user.id)) return false;
      
      const isIndividualMember = p.individualMembers?.some(
        id => Number(id) === Number(user.id)
      );
      
      const isInTeam = p.teamIds?.some(teamId => {
        const team = data.teams.find(t => Number(t.id) === Number(teamId));
        if (!team) return false;
        return team.members?.some(id => Number(id) === Number(user.id));
      });
      
      return isIndividualMember || isInTeam;
    });
    
    const tasksAssignedToManager = tasks.filter(t => Number(t.assigneeId) === Number(user.id));
    const completedTasks = tasks.filter(t => t.status === "done").length;

    stats = [
      { label: "Managed Projects", value: managedProjects.length, color: "#8d877e" },
      { label: "Member Projects", value: memberProjects.length, color: "#8d877e" },
      { label: "Total Projects", value: projects.length, color: "#8d877e" },
      { label: "Total Tasks", value: tasks.length, color: "#8d877e" },
      { label: "My Tasks", value: tasksAssignedToManager.length, color: "#8d877e" },
      { label: "Completed Tasks", value: completedTasks, color: "#8d877e" }
    ];
    
  } else if (user.role === "employee") {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "done").length;

    stats = [
      { label: "My Projects", value: projects.length, color: "#8d877e" },
      { label: "My Tasks", value: totalTasks, color: "#8d877e" },
      { label: "Completed Tasks", value: completedTasks, color: "#8d877e" }
    ];
  }

  if (stats.length === 0 || stats.every(s => s.value === 0)) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#e8e8e8" }}>
          Welcome back, {user.name.split(" ")[0]}
        </Typography>
        <Typography variant="body2" color="text.secondary" textTransform="capitalize">
          {user.role} Dashboard
        </Typography>
        <Box sx={{ mt: 4, p: 4, textAlign: 'center', border: '1px solid #2a2a2a', borderRadius: 3, bgcolor: '#1a1a1a' }}>
          <Typography variant="body1" color="text.secondary">
            {user.role === "employee" 
              ? "No projects or tasks assigned to you yet."
              : "No projects or tasks available."}
          </Typography>
        </Box>
      </Box>
    );
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
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{
              borderRadius: 3,
              border: "1px solid #2a2a2a",
              bgcolor: "#1a1a1a",
              transition: "transform 0.2s, box-shadow 0.2s",
              '&:hover': { 
                transform: "translateY(-4px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)"
              }
            }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: stat.color || "#6c63ff" }}>
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