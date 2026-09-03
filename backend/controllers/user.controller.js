// Note: User controller with role-based access and user management
import { 
  getDatabase, 
  saveDatabase, 
  findUserById, 
  generateId,
  hashPassword 
} from '../services/db.service.js';

// Get all users (Admin only) - SHOW ALL USERS including inactive
export const getAllUsers = async (req, res) => {
  try {
    const db = getDatabase();
    // Return ALL users without filtering by active status
    const users = db.users.map(({ password, ...user }) => user);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Get users for team assignment (Admin and Manager) for only active users
export const getUsersForTeam = async (req, res) => {
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

// Get assignable users based on role for only active users
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

// Create user for admin only
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body;

    const db = getDatabase();
    
    if (db.users.some(u => u.email === email)) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);
    
    const newUser = {
      id: generateId(),
      name,
      email,
      password: hashedPassword,
      role,
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    db.users.push(newUser);
    await saveDatabase();

    const { password: _, ...userData } = newUser;
    res.status(201).json(userData);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// // Update user for admin only
// export const updateUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, email, password, role, active } = req.body;

//     const user = findUserById(Number(id));
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (user.role === 'admin' && role && role !== 'admin') {
//       return res.status(400).json({ message: 'Cannot change admin role' });
//     }

//     if (name) user.name = name;
//     if (email) {
//       const db = getDatabase();
//       const existing = db.users.find(u => u.email === email && u.id !== user.id);
//       if (existing) {
//         return res.status(400).json({ message: 'Email already in use' });
//       }
//       user.email = email;
//     }
//     if (password) {
//       user.password = await hashPassword(password);
//     }
//     if (role) user.role = role;
//     if (active !== undefined) user.active = active;

//     await saveDatabase();

//     const { password: _, ...userData } = user;
//     res.json(userData);
//   } catch (error) {
//     console.error('Update user error:', error);
//     res.status(500).json({ message: 'Failed to update user' });
//   }
// };

// Delete user for admin only
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    const user = findUserById(Number(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete users' });
    }

    const db = getDatabase();

    db.users = db.users.filter(u => u.id !== Number(id));
    
    db.teams = db.teams.map(team => ({
      ...team,
      members: team.members?.filter(memberId => memberId !== Number(id)) || []
    }));
    
    db.projects = db.projects.map(project => ({
      ...project,
      individualMembers: project.individualMembers?.filter(memberId => memberId !== Number(id)) || []
    }));
    
    db.tasks = db.tasks.map(task => ({
      ...task,
      assigneeId: task.assigneeId === Number(id) ? null : task.assigneeId,
      createdBy: task.createdBy === Number(id) ? null : task.createdBy
    }));

    await saveDatabase();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Update user role for admin only
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = findUserById(Number(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot change admin role' });
    }

    user.role = role;
    await saveDatabase();

    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// Update user status for admin only
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const user = findUserById(Number(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot change admin status' });
    }

    user.active = active;
    await saveDatabase();

    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};