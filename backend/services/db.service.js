import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/db.json');

let database = null;
const isDevelopment = process.env.NODE_ENV === 'development';

export const initializeDatabase = () => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      database = JSON.parse(data);
      
      if (!database.users) database.users = [];
      if (!database.projects) database.projects = [];
      if (!database.tasks) database.tasks = [];
      if (!database.teams) database.teams = [];
      if (!database.sessions) database.sessions = [];
      if (!database.blacklist) database.blacklist = [];
      
      saveDatabase();
      if (isDevelopment) {
        console.log('database loaded');
      }
    } else {
      database = { 
        users: [], 
        projects: [], 
        tasks: [], 
        teams: [], 
        sessions: [],
        blacklist: []
      };
      saveDatabase();
      if (isDevelopment) {
        console.log('new database created');
      }
    }
    return database;
  } catch (error) {
    console.error('database init failed:', error);
    process.exit(1);
  }
};

export const getDatabase = () => {
  if (!database) {
    initializeDatabase();
  }
  return database;
};

export const saveDatabase = () => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('save failed:', error);
    throw error;
  }
};

export const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const findUserById = (id) => {
  return getDatabase().users.find(u => u.id === id);
};

export const findUserByEmail = (email) => {
  return getDatabase().users.find(u => u.email === email);
};

export const findProjectById = (id) => {
  return getDatabase().projects.find(p => p.id === id);
};

export const findTaskById = (id) => {
  return getDatabase().tasks.find(t => t.id === id);
};

export const findTeamById = (id) => {
  return getDatabase().teams.find(t => t.id === id);
};

export const getAccessibleUserIds = (userId) => {
  const db = getDatabase();
  const user = findUserById(userId);
  
  if (!user) return new Set();

  if (user.role === 'admin') {
    return new Set(db.users.map(u => u.id));
  }

  const accessibleIds = new Set([userId]);

  const userProjects = db.projects.filter(p => {
    if (p.individualMembers?.includes(userId)) return true;
    const userTeams = db.teams.filter(t => t.members?.includes(userId));
    return userTeams.some(team => p.teamIds?.includes(team.id));
  });

  userProjects.forEach(project => {
    if (project.managerId) accessibleIds.add(project.managerId);
    project.individualMembers?.forEach(id => accessibleIds.add(id));
    
    project.teamIds?.forEach(teamId => {
      const team = findTeamById(teamId);
      team?.members?.forEach(id => accessibleIds.add(id));
    });
  });

  return accessibleIds;
};
