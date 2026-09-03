// Note: Team controller with role-based access and team management
import { 
  getDatabase, 
  saveDatabase, 
  generateId, 
  findTeamById, 
  findUserById 
} from '../services/db.service.js';

// Get all teams with role-based filtering
export const getAllTeams = async (req, res) => {
  try {
    const db = getDatabase();
    const { role, id: userId } = req.user;

    let teams = db.teams;

    if (role === 'employee') {
      teams = teams.filter(t => t.members?.includes(userId) || t.leaderId === userId);
    } else if (role === 'manager') {
      teams = teams.filter(t => t.leaderId === userId || t.members?.includes(userId));
    }

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Failed to get teams' });
  }
};

// Get team by ID
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = findTeamById(Number(id));
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Failed to get team' });
  }
};

// Create team for admin only
export const createTeam = async (req, res) => {
  try {
    const { name, members = [], leaderId } = req.body;

    if (!name || !leaderId) {
      return res.status(400).json({ message: 'Name and leader are required' });
    }

    const leader = findUserById(Number(leaderId));
    if (!leader) {
      return res.status(404).json({ message: 'Leader not found' });
    }

    const db = getDatabase();
    const team = {
      id: generateId(),
      name,
      members: members.map(Number),
      leaderId: Number(leaderId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.teams.push(team);
    await saveDatabase();

    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Failed to create team' });
  }
};

// Update team for admin 
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, members, leaderId } = req.body;

    const team = findTeamById(Number(id));
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (name) team.name = name;
    if (members) team.members = members.map(Number);
    if (leaderId) {
      const leader = findUserById(Number(leaderId));
      if (!leader) {
        return res.status(404).json({ message: 'Leader not found' });
      }
      team.leaderId = Number(leaderId);
    }
    team.updatedAt = new Date().toISOString();

    await saveDatabase();
    res.json(team);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Failed to update team' });
  }
};

// Delete team for admin only
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = findTeamById(Number(id));
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const db = getDatabase();
    db.teams = db.teams.filter(t => t.id !== Number(id));
    
    // Remove team from projects
    db.projects = db.projects.map(p => ({
      ...p,
      teamIds: p.teamIds?.filter(tid => tid !== Number(id)) || []
    }));
    
    await saveDatabase();
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Failed to delete team' });
  }
};

// Get users for team assignment for admin and manager
export const getUsersForTeam = async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.users
      .filter(u => u.active !== false)
      .map(({ password, ...user }) => user);
    res.json(users);
  } catch (error) {
    console.error('Get users for team error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};