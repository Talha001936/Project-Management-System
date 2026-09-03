//Note: This controller handles project-related operations, including CRUD operations and role-based access 
import { 
  getDatabase, 
  saveDatabase, 
  generateId, 
  findProjectById, 
  findUserById, 
  findTeamById 
} from '../services/db.service.js';

// Note: Get all projects with role-based filtering
export const getAllProjects = async (req, res) => {
  try {
    const db = getDatabase();
    const { role, id: userId } = req.user;

    let projects = db.projects;
    if (role === 'employee') {
      projects = projects.filter(p => {
        if (p.managerId === userId) return true;
        if (p.individualMembers?.includes(userId)) return true;
        if (p.teamIds) {
          return p.teamIds.some(teamId => {
            const team = findTeamById(teamId);
            return team?.members?.includes(userId);
          });
        }
        return false;
      });
    } else if (role === 'manager') {
      projects = projects.filter(p => {
        if (p.managerId === userId) return true;
        if (p.individualMembers?.includes(userId)) return true;
        if (p.teamIds) {
          return p.teamIds.some(teamId => {
            const team = findTeamById(teamId);
            return team?.members?.includes(userId);
          });
        }
        return false;
      });
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Failed to get projects' });
  }
};

//Note: Get a project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = findProjectById(Number(id));
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Failed to get project' });
  }
};

// Create project for admin and manager
export const createProject = async (req, res) => {
  try {
    const { name, description, managerId, teamIds = [], individualMembers = [] } = req.body;
    const { id: userId } = req.user;

    if (!name || !managerId) {
      return res.status(400).json({ message: 'Name and manager are required' });
    }

    const manager = findUserById(Number(managerId));
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    const db = getDatabase();
    const project = {
      id: generateId(),
      name,
      description: description || '',
      managerId: Number(managerId),
      teamIds: teamIds.map(Number),
      individualMembers: individualMembers.map(Number),
      createdBy: userId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.projects.push(project);
    await saveDatabase();

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
};

// Update project for admin and project manager
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, managerId, teamIds, individualMembers, status } = req.body;
    const { role, id: userId } = req.user;

    const project = findProjectById(Number(id));
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Authorization check
    if (role !== 'admin' && project.managerId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this project' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (managerId) project.managerId = Number(managerId);
    if (teamIds) project.teamIds = teamIds.map(Number);
    if (individualMembers) project.individualMembers = individualMembers.map(Number);
    if (status) project.status = status;
    project.updatedAt = new Date().toISOString();

    await saveDatabase();
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
};

// Delete project for admin and project manager
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const project = findProjectById(Number(id));
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Authorization check
    if (role !== 'admin' && project.managerId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this project' });
    }

    const db = getDatabase();
    db.projects = db.projects.filter(p => p.id !== Number(id));
    db.tasks = db.tasks.filter(t => t.projectId !== Number(id));
    
    await saveDatabase();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

// Get all users for admin and manager
export const getAllUsers = async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.users
      .filter(u => u.active !== false)
      .map(({ password, ...user }) => user);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Get all teams for admin and manager
export const getAllTeams = async (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Failed to get teams' });
  }
};

//  Get users list which accessible to all authenticated users
export const getUsersList = async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.users
      .filter(u => u.active !== false)
      .map(({ password, ...user }) => user);
    res.json(users);
  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Get teams list which accessible to all authenticated users
export const getTeamsList = async (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.teams);
  } catch (error) {
    console.error('Get teams list error:', error);
    res.status(500).json({ message: 'Failed to get teams' });
  }
};

// Get assignable users based on role
export const getAssignableUsers = async (req, res) => {
  try {
    const db = getDatabase();
    const { id: userId, role } = req.user;

    let users = db.users.filter(u => u.active !== false);

    if (role === 'employee') {
      users = users.filter(u => u.id === userId);
    } else if (role === 'manager') {
      const projectIds = db.projects
        .filter(p => p.managerId === userId)
        .map(p => p.id);
      
      const teamIds = new Set();
      db.projects
        .filter(p => projectIds.includes(p.id))
        .forEach(p => p.teamIds?.forEach(id => teamIds.add(id)));
      
      const memberIds = new Set([userId]);
      db.teams
        .filter(t => teamIds.has(t.id))
        .forEach(t => t.members?.forEach(id => memberIds.add(id)));
      
      db.projects
        .filter(p => projectIds.includes(p.id))
        .forEach(p => p.individualMembers?.forEach(id => memberIds.add(id)));

      users = users.filter(u => memberIds.has(u.id));
    }

    users = users.map(({ password, ...user }) => user);
    res.json(users);
  } catch (error) {
    console.error('Get assignable users error:', error);
    res.status(500).json({ message: 'Failed to get assignable users' });
  }
};