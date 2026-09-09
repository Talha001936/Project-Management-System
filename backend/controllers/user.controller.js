//Note : this controller is used for crud operaion for users and get acces to user data.
import {
  getDatabase,
  saveDatabase,
  findUserById,
  generateId,
  hashPassword,
  getAccessibleUserIds
} from '../services/db.service.js';
import { USER_ROLE } from '../utils/constants.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAllUsers = async (req, res) => {
  try {
    const db = getDatabase();
    const { role } = req.user;

    if (role !== USER_ROLE.ADMIN) {
      return errorResponse(res, 'only admin can view all users', 403);
    }

    let users = db.users;

    if (req.query.role) {
      users = users.filter(u => u.role === req.query.role);
    }

    if (req.query.active !== undefined) {
      const isActive = req.query.active === 'true';
      users = users.filter(u => u.active === isActive);
    }

    const usersWP = users.map(user => {
      const userData = { ...user };
      delete userData.password;
      return userData;
    });

    return successResponse(res, 'Users fetched successfully', usersWP);
  } catch (error) {
    console.error('get users error:', error);
    return errorResponse(res, 'Failed to get users', 500);
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = USER_ROLE.EMPLOYEE, active = true } = req.body;

    const db = getDatabase();

    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return errorResponse(res, 'Email already registered', 400);
    }

    if (role === USER_ROLE.ADMIN) {
      return errorResponse(res, 'Cannot create admin accounts.', 400);
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: generateId(),
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || USER_ROLE.EMPLOYEE,
      active,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    db.users.push(newUser);
    await saveDatabase();

    const userData = { ...newUser };
    delete userData.password;
    return successResponse(res, 'User created successfully', userData);
  } catch (error) {
    console.error('create user error:', error);
    return errorResponse(res, 'Failed to create user', 500);
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = findUserById(parseInt(id));
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.role === USER_ROLE.ADMIN) {
      return errorResponse(res, 'Cannot change admin role', 400);
    }

    if (role === USER_ROLE.ADMIN) {
      return errorResponse(res, 'Cannot assign admin role', 400);
    }

    if (![USER_ROLE.MANAGER, USER_ROLE.EMPLOYEE].includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    const oldRole = user.role;
    user.role = role;
    await saveDatabase();

    const userData = { ...user };
    delete userData.password;
    return successResponse(res, `Role changed from ${oldRole} to ${role}`, userData);
  } catch (error) {
    console.error('update role error:', error);
    return errorResponse(res, 'Failed to update user role', 500);
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (active === undefined) {
      return errorResponse(res, 'Active status is required', 400);
    }

    const user = findUserById(parseInt(id));
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.role === USER_ROLE.ADMIN) {
      return errorResponse(res, 'Cannot change admin status', 400);
    }

    user.active = active;
    await saveDatabase();

    const userData = { ...user };
    delete userData.password;
    return successResponse(res, active ? 'User activated successfully' : 'User deactivated successfully', userData);
  } catch (error) {
    console.error('update status error:', error);
    return errorResponse(res, 'Failed to update user status', 500);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = findUserById(parseInt(id));
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.role === USER_ROLE.ADMIN) {
      return errorResponse(res, 'Cannot delete admin accounts', 400);
    }

    const db = getDatabase();

    const activeTasks = db.tasks.filter(t =>
      t.assigneeId === user.id &&
      t.status !== 'done'
    );

    if (activeTasks.length > 0) {
      return errorResponse(res, `Cannot delete user with ${activeTasks.length} active tasks. Reassign or complete tasks first.`, 400);
    }

    db.users = db.users.filter(u => u.id !== user.id);

    db.teams = db.teams.map(team => ({
      ...team,
      members: team.members?.filter(memberId => memberId !== user.id) || []
    }));

    db.projects = db.projects.map(project => ({
      ...project,
      individualMembers: project.individualMembers?.filter(memberId => memberId !== user.id) || []
    }));

    db.tasks = db.tasks.map(task => ({
      ...task,
      assigneeId: task.assigneeId === user.id ? null : task.assigneeId,
      createdBy: task.createdBy === user.id ? null : task.createdBy
    }));

    await saveDatabase();

    return successResponse(res, `User ${user.name} deleted successfully`, { userId: user.id });
  } catch (error) {
    console.error('delete user error:', error);
    return errorResponse(res, 'Failed to delete user', 500);
  }
};

export const getAssignableUsers = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const db = getDatabase();

    let users = db.users.filter(u => u.active !== false);

    if (role === USER_ROLE.ADMIN) {
      users = users.filter(u => u.role !== USER_ROLE.ADMIN);
    } else if (role === USER_ROLE.MANAGER) {
      const accessibleIds = getAccessibleUserIds(userId);
      users = users.filter(u => accessibleIds.has(u.id) && u.role !== USER_ROLE.ADMIN);
    } else if (role === USER_ROLE.EMPLOYEE) {
      
      users = users.filter(u => u.id === userId);
    }

    const usersWP = users.map(user => {
      const userData = { ...user };
      delete userData.password;
      return userData;
    });

    return successResponse(res, 'Assignable users fetched successfully', usersWP);
  } catch (error) {
    console.error('get assignable users error:', error);
    return errorResponse(res, 'Failed to get assignable users', 500);
  }
};
 
export const getuserlist=async (req, res) => {
  try {
    const db = getDatabase();
    const { role, id: userId } = req.user;

    let users = db.users.filter(u => u.active !== false);

    
    if (role !== USER_ROLE.ADMIN) {
      
      const userProjects = db.projects.filter(p => 
        p.individualMembers?.includes(userId) ||
        p.teamIds?.some(teamId => {
          const team = db.teams.find(t => t.id === teamId);
          return team?.members?.includes(userId);
        })
      );

      const projectUserIds = new Set();
      userProjects.forEach(project => {
        if (project.managerId) projectUserIds.add(project.managerId);
        project.individualMembers?.forEach(id => projectUserIds.add(id));
        project.teamIds?.forEach(teamId => {
          const team = db.teams.find(t => t.id === teamId);
          team?.members?.forEach(id => projectUserIds.add(id));
        });
      });

      
      projectUserIds.add(userId);

      
      db.users.forEach(u => {
        if (u.role === USER_ROLE.ADMIN && u.active !== false) {
          projectUserIds.add(u.id);
        }
      });

      users = users.filter(u => projectUserIds.has(u.id));
    }
   
    const usersWP = users.map(user => {
      const userData = { ...user };
      delete userData.password;
      return userData;
    });

    return successResponse(res, 'Users fetched successfully', usersWP);
  } catch (error) {
    console.error('get public users error:', error);
    return errorResponse(res, 'Failed to get users', 500);
  }
}
