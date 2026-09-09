
//note: this file is used to provide some functions that multiple components require multile times.
export const getUserName = (id, users) => {
  if (!id) return "Unassigned";
  if (!users || !Array.isArray(users) || users.length === 0) {
    try {
      const storedUser = sessionStorage.getItem('pms_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (Number(user.id) === Number(id)) {
          return user.name;
        }
      }
    } catch (e) {
      
    }
    return `User #${id}`;
  }
  const user = users.find((u) => Number(u.id) === Number(id));
  return user?.name || `User #${id}`;
};

export const getTeamName = (id, teams) => {
  if (!id) return "No team";
  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    try {
      const cachedTeams = localStorage.getItem('pms_cached_teams');
      if (cachedTeams) {
        const parsedTeams = JSON.parse(cachedTeams);
        const team = parsedTeams.find((t) => Number(t.id) === Number(id));
        if (team?.name) return team.name;
      }
    } catch (e) {
      
    }
    return `Team #${id}`;
  }
  const team = teams.find((t) => Number(t.id) === Number(id));
  return team?.name || `Team #${id}`;
};

export const getProjectMembers = (project, teams) => {
  const memberSet = new Set();
  
  if (!project) return [];
  
  if (project.individualMembers) {
    project.individualMembers.forEach(id => memberSet.add(Number(id)));
  }
  
  if (project.teamIds && teams) {
    project.teamIds.forEach(teamId => {
      const team = teams.find(t => Number(t.id) === Number(teamId));
      if (team?.members) {
        team.members.forEach(id => memberSet.add(Number(id)));
      }
    });
  }
  
  if (project.managerId) {
    memberSet.add(Number(project.managerId));
  }
  
  return Array.from(memberSet);
};

export const getProjectName = (id, projects) => {
  if (!id) return "No Project";
  if (!projects || !Array.isArray(projects) || projects.length === 0) return `Project #${id}`;
  const project = projects.find((p) => Number(p.id) === Number(id));
  return project?.name || `Project #${id}`;
};

export const getStatusLabel = (status) => {
  const labels = {
    todo: "To Do",
    "in-progress": "In Progress",
    review: "Review",
    done: "Done",
  };
  return labels[status] || status || "Unknown";
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

export const isProjectManager = (project, userId) => {
  if (!project || !userId) return false;
  return Number(project.managerId) === Number(userId);
};

export const isTeamLeader = (team, userId) => {
  if (!team || !userId) return false;
  return Number(team.leaderId) === Number(userId);
};

export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.role);
};

export const getRoleConfig = (role) => {
  const configs = {
    admin: {
      label: "Admin",
      color: "#d45454",
      bgColor: "rgba(212,84,84,0.12)",
      borderColor: "1px solid rgba(212,84,84,0.25)",
      icon: "👑"
    },
    manager: {
      label: "Manager",
      color: "#f0a030",
      bgColor: "rgba(240,160,48,0.12)",
      borderColor: "1px solid rgba(240,160,48,0.25)",
      icon: "📊"
    },
    employee: {
      label: "Employee",
      color: "#6c63ff",
      bgColor: "rgba(108,99,255,0.12)",
      borderColor: "1px solid rgba(108,99,255,0.25)",
      icon: "👤"
    }
  };
  return configs[role] || configs.employee;
};

export const getRoleColor = (role) => {
  const config = getRoleConfig(role);
  return config.color;
};

export const getRoleBgColor = (role) => {
  const config = getRoleConfig(role);
  return config.bgColor;
};