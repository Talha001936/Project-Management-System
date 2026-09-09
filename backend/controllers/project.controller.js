//Note : this controller is used for crud operaion for projects and role based and permission bsed access
import {
  getDatabase,
  saveDatabase,
  generateId,
  findProjectById,
  findUserById
} from '../services/db.service.js';
import { USER_ROLE } from '../utils/constants.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAllProjects = async (req, res) => {
  try {
    const db = getDatabase();
    const { role, id: userId } = req.user;

    let projects = db.projects;

    if (role === USER_ROLE.EMPLOYEE) {
      const userTeams = db.teams.filter(t => t.members?.includes(userId));
      const teamIds = userTeams.map(t => t.id);

      projects = projects.filter(p =>
        p.individualMembers?.includes(userId) ||
        p.teamIds?.some(id => teamIds.includes(id))
      );
    } else if (role === USER_ROLE.MANAGER) {
      const userTeams = db.teams.filter(t => t.members?.includes(userId));
      const teamIds = userTeams.map(t => t.id);

      projects = projects.filter(p =>
        p.managerId === userId ||
        p.individualMembers?.includes(userId) ||
        p.teamIds?.some(id => teamIds.includes(id))
      );
    }

    return successResponse(res, 'Projects fetched successfully', projects);
  } catch (error) {
    console.error('get projects error:', error);
    return errorResponse(res, 'Failed to get projects', 500);
  }
};


export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = findProjectById(parseInt(id));
    
    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    const db = getDatabase();
    const projectWithDetails = {
      ...project,
      manager: db.users.find(u => u.id === project.managerId),
      tasks: db.tasks.filter(t => t.projectId === project.id),
      teams: project.teamIds?.map(teamId => db.teams.find(t => t.id === teamId)) || [],
      members: project.individualMembers?.map(memberId => {
        const user = db.users.find(u => u.id === memberId);
        if (user) {
          const { password, ...userData } = user;
          return userData;
        }
        return null;
      }).filter(Boolean) || []
    };

    return successResponse(res, 'Project fetched successfully', projectWithDetails);
  } catch (error) {
    console.error('get project error:', error);
    return errorResponse(res, 'Failed to get project', 500);
  }
};


export const createProject = async (req, res) => {
  try {
    const { name, description, managerId, teamIds = [], individualMembers = [] } = req.body;
    const { id: userId, role } = req.user;

    const db = getDatabase();

    const manager = findUserById(parseInt(managerId));
    if (!manager) {
      return errorResponse(res, 'Manager not found', 404);
    }

    if (manager.active === false) {
      return errorResponse(res, 'Manager account is inactive', 400);
    }

    if (role === USER_ROLE.MANAGER && parseInt(managerId) !== userId) {
      return errorResponse(res, 'Managers can only assign themselves as project manager', 403);
    }

    if (role === USER_ROLE.ADMIN) {
      if (manager.role !== USER_ROLE.MANAGER && manager.role !== USER_ROLE.ADMIN) {
        return errorResponse(res, 'Assigned manager must have manager or admin role', 400);
      }
    }

    if (teamIds.length > 0) {
      const validTeams = teamIds.every(id => db.teams.some(t => t.id === id));
      if (!validTeams) {
        return errorResponse(res, 'One or more team IDs are invalid', 400);
      }
    }

    if (individualMembers.length > 0) {
      const validMembers = individualMembers.every(id =>
        db.users.some(u => u.id === id && u.active !== false)
      );
      if (!validMembers) {
        return errorResponse(res, 'One or more member IDs are invalid', 400);
      }
    }

    if (db.projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return errorResponse(res, 'Project name already exists', 400);
    }

    const project = {
      id: generateId(),
      name: name.trim(),
      description: description?.trim() || '',
      managerId: parseInt(managerId),
      teamIds: teamIds.map(id => parseInt(id)),
      individualMembers: individualMembers.map(id => parseInt(id)),
      createdBy: userId,
      status: 'active',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.projects.push(project);
    await saveDatabase();

    return successResponse(res, 'Project created successfully', project);
  } catch (error) {
    console.error('create project error:', error);
    return errorResponse(res, 'Failed to create project', 500);
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, managerId, teamIds, individualMembers, status, priority } = req.body;
    const { role, id: userId } = req.user;

    const project = findProjectById(parseInt(id));
    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    if (role !== USER_ROLE.ADMIN && project.managerId !== userId) {
      return errorResponse(res, 'You do not have permission to update this project', 403);
    }

    const db = getDatabase();

    if (name) {
      if (db.projects.some(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== project.id)) {
        return errorResponse(res, 'Project name already exists', 400);
      }
      project.name = name.trim();
    }

    if (managerId) {
      const manager = findUserById(parseInt(managerId));
      if (!manager) {
        return errorResponse(res, 'Manager not found', 404);
      }
      if (manager.active === false) {
        return errorResponse(res, 'Manager account is inactive', 400);
      }
      if (manager.role !== USER_ROLE.MANAGER && manager.role !== USER_ROLE.ADMIN) {
        return errorResponse(res, 'Manager must have manager or admin role', 400);
      }
      project.managerId = parseInt(managerId);
    }

    if (teamIds) {
      const validTeams = teamIds.every(id => db.teams.some(t => t.id === id));
      if (!validTeams) {
        return errorResponse(res, 'One or more team IDs are invalid', 400);
      }
      project.teamIds = teamIds.map(id => parseInt(id));
    }

    if (individualMembers) {
      const validMembers = individualMembers.every(id =>
        db.users.some(u => u.id === id && u.active !== false)
      );
      if (!validMembers) {
        return errorResponse(res, 'One or more member IDs are invalid', 400);
      }
      project.individualMembers = individualMembers.map(id => parseInt(id));
    }

    if (description !== undefined) project.description = description.trim();
    if (status) project.status = status;
    if (priority) project.priority = priority;

    project.updatedAt = new Date().toISOString();
    await saveDatabase();

    return successResponse(res, 'Project updated successfully', project);
  } catch (error) {
    console.error('update project error:', error);
    return errorResponse(res, 'Failed to update project', 500);
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const project = findProjectById(parseInt(id));
    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    if (role !== USER_ROLE.ADMIN && project.managerId !== userId) {
      return errorResponse(res, 'You do not have permission to delete this project', 403);
    }

    const db = getDatabase();

    const activeTasks = db.tasks.filter(t =>
      t.projectId === project.id &&
      t.status !== 'done'
    );

    if (activeTasks.length > 0) {
      return errorResponse(res, `Cannot delete project with ${activeTasks.length} active tasks. Complete or reassign tasks first.`, 400);
    }

    db.projects = db.projects.filter(p => p.id !== project.id);
    db.tasks = db.tasks.filter(t => t.projectId !== project.id);

    await saveDatabase();

    return successResponse(res, 'Project deleted successfully');
  } catch (error) {
    console.error('delete project error:', error);
    return errorResponse(res, 'Failed to delete project', 500);
  }
};


export const getProjectUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    
    const project = findProjectById(parseInt(id));
    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    const db = getDatabase();
    const usersSet = new Set();
    
    // Add project manager
    if (project.managerId) {
      const manager = db.users.find(u => u.id === project.managerId);
      if (manager && manager.active !== false) {
        const { password, ...managerData } = manager;
        usersSet.add(JSON.stringify(managerData));
      }
    }
    
    if (project.individualMembers) {
      project.individualMembers.forEach(memberId => {
        const member = db.users.find(u => u.id === memberId);
        if (member && member.active !== false) {
          const { password, ...memberData } = member;
          usersSet.add(JSON.stringify(memberData));
        }
      });
    }
    
    if (project.teamIds) {
      project.teamIds.forEach(teamId => {
        const team = db.teams.find(t => t.id === teamId);
        if (team && team.members) {
          team.members.forEach(memberId => {
            const member = db.users.find(u => u.id === memberId);
            if (member && member.active !== false) {
              const { password, ...memberData } = member;
              usersSet.add(JSON.stringify(memberData));
            }
          });
        }
      });
    }
    
    let users = Array.from(usersSet).map(u => JSON.parse(u));
    
    if (role === USER_ROLE.EMPLOYEE) {
      users = users.filter(u => u.id === userId);
    }
    
    return successResponse(res, 'Project users fetched successfully', users);
  } catch (error) {
    console.error('get project users error:', error);
    return errorResponse(res, 'Failed to get project users', 500);
  }
};

export const getProjectTeams = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    
    const project = findProjectById(parseInt(id));
    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    const db = getDatabase();
    let teams = [];
    
    if (project.teamIds) {
      teams = project.teamIds
        .map(teamId => db.teams.find(t => t.id === teamId))
        .filter(team => team !== undefined);
    }
    
    // Filter teams for employees (they can only see teams they're in)
    if (role === USER_ROLE.EMPLOYEE) {
      teams = teams.filter(team => 
        team.members?.includes(userId) || team.leaderId === userId
      );
    }
    

    const teamsWithDetails = teams.map(team => ({
      id: team.id,
      name: team.name,
      leaderId: team.leaderId,
      memberCount: team.members?.length || 0,
      members: (role === USER_ROLE.ADMIN || role === USER_ROLE.MANAGER) 
        ? team.members || [] 
        : undefined
    }));
    
    return successResponse(res, 'Project teams fetched successfully', teamsWithDetails);
  } catch (error) {
    console.error('get project teams error:', error);
    return errorResponse(res, 'Failed to get project teams', 500);
  }
};
