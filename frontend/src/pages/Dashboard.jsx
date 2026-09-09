import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoadData } from '../hooks/useLoadData.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import api from '../api/axios.js';
import { useToast } from '../hooks/useToast.jsx';
import { useEffect } from 'react';
import { sessionManager } from '../utils/sessionManager.js';

export default function Dashboard() {
  const { user } = useAuth();
  const { showError } = useToast();

  const fetchDashboardData = async () => {
    if (!user || sessionManager._isLoggingOut) {
      throw new Error('User not authenticated');
    }

    const userResponse = await api.get('/auth/me');
    const userData = userResponse.data?.success ? userResponse.data.data : userResponse.data;

    if (user.role === 'admin') {
      const [projectsRes, tasksRes, usersRes, teamsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/users'),
        api.get('/teams'),
      ]);

      return {
        user: userData,
        projects: projectsRes.data?.success ? projectsRes.data.data : projectsRes.data || [],
        tasks: tasksRes.data?.success ? tasksRes.data.data : tasksRes.data || [],
        users: usersRes.data?.success ? usersRes.data.data : usersRes.data || [],
        teams: teamsRes.data?.success ? teamsRes.data.data : teamsRes.data || [],
      };
    } else if (user.role === 'manager') {
      const [projectsRes, tasksRes, teamsRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/teams'),
        api.get('/users/assignable'),
      ]);

      return {
        user: userData,
        projects: projectsRes.data?.success ? projectsRes.data.data : projectsRes.data || [],
        tasks: tasksRes.data?.success ? tasksRes.data.data : tasksRes.data || [],
        teams: teamsRes.data?.success ? teamsRes.data.data : teamsRes.data || [],
        users: usersRes.data?.success ? usersRes.data.data : usersRes.data || [],
      };
    } else {
      return { user: userData };
    }
  };

  const { data, loading, error } = useLoadData(
    fetchDashboardData,
    [user?.id, user?.role],
    `dashboard_${user?.role}`
  );

  useEffect(() => {
    if (error) {
      if (error.message === 'User not authenticated' || error.response?.status === 401) {
        return;
      }
      showError(error);
    }
  }, [error, showError]);

  const calculateAdminStats = (projects, tasks, users) => {
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const activeUsers = users?.filter(u => u.active !== false).length || 0;
    return [
      { label: 'Total Projects', value: projects.length },
      { label: 'Total Tasks', value: tasks.length },
      { label: 'Completed Tasks', value: completedTasks },
      { label: 'Active Users', value: activeUsers },
    ];
  };

  const calculateManagerStats = (projects, tasks, teams, userId) => {
    const myProjects = projects.filter(p => Number(p.managerId) === Number(userId));

    const memberProjects = projects.filter(p => {
      if (p.individualMembers?.includes(Number(userId))) {
        return true;
      }
      if (p.teamIds) {
        return p.teamIds.some(teamId => {
          const team = teams.find(t => Number(t.id) === Number(teamId));
          return team?.members?.includes(Number(userId));
        });
      }
      return false;
    });

    const memberProjectsSet = new Set(memberProjects.map(p => p.id));
    myProjects.forEach(p => memberProjectsSet.delete(p.id));
    const memberProjectsCount = memberProjectsSet.size;

    const myTasks = tasks.filter(t => Number(t.assigneeId) === Number(userId));
    const managedProjectIds = myProjects.map(p => p.id);
    const accessibleProjectIds = [...managedProjectIds, ...Array.from(memberProjectsSet)];
    const accessibleTasks = tasks.filter(t => accessibleProjectIds.includes(Number(t.projectId)));

    const managerTeams = teams.filter(
      t => t.members?.includes(Number(userId)) || Number(t.leaderId) === Number(userId)
    );

    return [
      { label: 'Total Projects', value: projects.length },
      { label: 'My Projects', value: myProjects.length },
      { label: "Projects I'm Member", value: memberProjectsCount },
      { label: 'Total Tasks', value: accessibleTasks.length },
      { label: 'My Tasks', value: myTasks.length },
      { label: 'Teams', value: managerTeams.length },
    ];
  };

  if (!user || sessionManager._isLoggingOut) {
    return null;
  }

  if (loading) return <LoadingSpinner />;

  if (error) {
    if (error.message === 'User not authenticated' || error.response?.status === 401) {
      return null;
    }
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: '#d45454' }}>
          {error.response?.status === 403
            ? 'You do not have permission to view all dashboard data.'
            : 'Failed to load dashboard data. Please try again.'}
        </Typography>
      </Box>
    );
  }

  if (!data) return null;

  const userStats = data.user?.stats || {};
  const tasks = data.tasks || [];
  const projects = data.projects || [];
  const teams = data.teams || [];

  let stats = [];

  if (user.role === 'admin') {
    stats = calculateAdminStats(projects, tasks, data.users);
  } else if (user.role === 'manager') {
    stats = calculateManagerStats(projects, tasks, teams, user.id);
  } else {
    stats = [
      { label: 'My Projects', value: userStats.projects || 0 },
      { label: 'My Tasks', value: userStats.totalTasks || 0 },
      { label: 'Completed Tasks', value: userStats.completedTasks || 0 },
      { label: 'Teams', value: userStats.teams || 0 },
    ];
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ color: '#e8e8e8' }}>
        Welcome back, {user.name.split(' ')[0]}
      </Typography>
      <Typography variant="body2" color="text.secondary" textTransform="capitalize">
        {user.role} Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {stats.map((stat, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{ borderRadius: 3, border: '1px solid #2a2a2a', bgcolor: '#1a1a1a' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#e8e8e8' }}>
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
