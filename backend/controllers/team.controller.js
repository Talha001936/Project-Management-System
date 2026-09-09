//Note : this controller is used for crud operaion for teams and get acces to team data.
import {
  getDatabase,
  saveDatabase,
  generateId,
  findTeamById,
  findUserById
} from '../services/db.service.js';
import { USER_ROLE } from '../utils/constants.js';
import { successResponse, errorResponse } from '../utils/response.js';

const validateTeamAccess = (team, userId, role) => {
  if (role === USER_ROLE.ADMIN) return true;
  if (role === USER_ROLE.MANAGER) {
    return team.leaderId === userId || team.members?.includes(userId);
  }
  return false;
};

const validateMembersExist = (memberIds, db) => {
  if (!memberIds || memberIds.length === 0) return false; 
  return memberIds.every(id =>
    db.users.some(u => u.id === id && u.active !== false)
  );
};


const hasDuplicateMembers = (memberIds) => {
  if (!memberIds || memberIds.length === 0) return false;
  const uniqueIds = new Set(memberIds);
  return uniqueIds.size !== memberIds.length;
};

export const getallteams = async (req, res) => {
  try {
    const db = getDatabase();
    const { role, id: userId } = req.user;

    let teams = db.teams;

    const teamsWithDetails = teams.map(team => ({
      id: team.id,
      name: team.name,
      members: (role === USER_ROLE.ADMIN || 
                team.members?.includes(userId) || 
                team.leaderId === userId) 
                ? (team.members || []) 
                : undefined,
      leaderId: (role === USER_ROLE.ADMIN || 
                 team.members?.includes(userId) || 
                 team.leaderId === userId) 
                ? team.leaderId 
                : undefined,
      ...(role === USER_ROLE.ADMIN ? {
        createdBy: team.createdBy,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      } : {})
    }));

    return successResponse(res, 'Teams fetched successfully', teamsWithDetails);
  } catch (error) {
    console.error('get teams error:', error);
    return errorResponse(res, 'Failed to get teams', 500);
  }
};


export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    if (role === USER_ROLE.EMPLOYEE) {
      return errorResponse(res, 'Access denied. Employees cannot view teams.', 403);
    }

    const team = findTeamById(parseInt(id));

    if (!team) {
      return errorResponse(res, 'Team not found', 404);
    }

    const hasAccess = validateTeamAccess(team, userId, role);

    if (!hasAccess) {
      return errorResponse(res, 'Access denied', 403);
    }

    const db = getDatabase();

    const teamWithDetails = {
      ...team,
      leader: db.users.find(u => u.id === team.leaderId),
      members: team.members?.map(id => {
        const user = db.users.find(u => u.id === id);
        if (user) {
          const { password, ...userData } = user;
          return userData;
        }
        return null;
      }).filter(Boolean) || [],
      projects: db.projects.filter(p => p.teamIds?.includes(team.id)),
      projectCount: db.projects.filter(p => p.teamIds?.includes(team.id)).length
    };

    return successResponse(res, 'Team fetched successfully', teamWithDetails);
  } catch (error) {
    console.error('get team error:', error);
    return errorResponse(res, 'Failed to get team', 500);
  }
};

export const createTeam = async (req, res) => {
  try {
    const { name, members = [], leaderId } = req.body;
    const { id: userId, role } = req.user;

    if (role !== USER_ROLE.ADMIN) {
      return errorResponse(res, 'Only admins can create teams', 403);
    }

    const db = getDatabase();


    if (db.teams.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      return errorResponse(res, 'Team name already exists', 400);
    }

    
    const leader = findUserById(parseInt(leaderId));
    if (!leader) {
      return errorResponse(res, 'Leader not found', 404);
    }

    if (leader.active === false) {
      return errorResponse(res, 'Leader account is inactive', 400);
    }

    
    if (!members || members.length === 0) {
      return errorResponse(res, 'Team must have at least one member', 400);
    }


    if (hasDuplicateMembers(members)) {
      return errorResponse(res, 'Duplicate members found in the team', 400);
    }


    let finalMembers = members.map(id => parseInt(id));
    if (!finalMembers.includes(parseInt(leaderId))) {
      finalMembers.push(parseInt(leaderId));
    }

    if (!validateMembersExist(finalMembers, db)) {
      return errorResponse(res, 'One or more member IDs are invalid or inactive', 400);
    }

    const team = {
      id: generateId(),
      name: name.trim(),
      members: finalMembers,
      leaderId: parseInt(leaderId),
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.teams.push(team);
    await saveDatabase();

    return successResponse(res, 'Team created successfully', team);
  } catch (error) {
    console.error('create team error:', error);
    return errorResponse(res, 'Failed to create team', 500);
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, members, leaderId } = req.body;
    const { role } = req.user;

    if (role !== USER_ROLE.ADMIN) {
      return errorResponse(res, 'Only admins can update teams', 403);
    }

    const team = findTeamById(parseInt(id));
    if (!team) {
      return errorResponse(res, 'Team not found', 404);
    }

    const db = getDatabase();

    if (name) {
      if (db.teams.some(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== team.id)) {
        return errorResponse(res, 'Team name already exists', 400);
      }
      team.name = name.trim();
    }

    if (leaderId) {
      const leader = findUserById(parseInt(leaderId));
      if (!leader) {
        return errorResponse(res, 'Leader not found', 404);
      }
      if (leader.active === false) {
        return errorResponse(res, 'Leader account is inactive', 400);
      }
      team.leaderId = parseInt(leaderId);
    }

    if (members !== undefined) {
      
      if (!members || members.length === 0) {
        return errorResponse(res, 'Team must have at least one member', 400);
      }


      if (hasDuplicateMembers(members)) {
        return errorResponse(res, 'Duplicate members found in the team', 400);
      }

      
      const currentLeaderId = leaderId ? parseInt(leaderId) : team.leaderId;
      let finalMembers = members.map(id => parseInt(id));
      if (!finalMembers.includes(currentLeaderId)) {
        finalMembers.push(currentLeaderId);
      }

      if (!validateMembersExist(finalMembers, db)) {
        return errorResponse(res, 'One or more member IDs are invalid or inactive', 400);
      }
      team.members = finalMembers;
    }

    team.updatedAt = new Date().toISOString();
    await saveDatabase();

    return successResponse(res, 'Team updated successfully', team);
  } catch (error) {
    console.error('update team error:', error);
    return errorResponse(res, 'Failed to update team', 500);
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== USER_ROLE.ADMIN) {
      return errorResponse(res, 'Only admins can delete teams', 403);
    }

    const team = findTeamById(parseInt(id));
    if (!team) {
      return errorResponse(res, 'Team not found', 404);
    }

    const db = getDatabase();

    const assignedProjects = db.projects.filter(p => p.teamIds?.includes(team.id));
    if (assignedProjects.length > 0) {
      return errorResponse(res, `Cannot delete team. It is assigned to ${assignedProjects.length} project(s). Remove team from projects first.`, 400);
    }

    db.teams = db.teams.filter(t => t.id !== team.id);

    db.projects = db.projects.map(p => ({
      ...p,
      teamIds: p.teamIds?.filter(tid => tid !== team.id) || []
    }));

    await saveDatabase();

    return successResponse(res, 'Team deleted successfully');
  } catch (error) {
    console.error('delete team error:', error);
    return errorResponse(res, 'Failed to delete team', 500);
  }
};
