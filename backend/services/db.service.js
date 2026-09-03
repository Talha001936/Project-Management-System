// Note: This service manages the database for the application. It provides functions to 
// initialize, read, and write to a JSON file that acts as a simple database. 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../data/db.json');

let database = null;

// Initialize database
export const initializeDatabase = () => {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      database = JSON.parse(data);
    } else {
      database = { users: [], projects: [], tasks: [], teams: [], sessions: [] };
      saveDatabase();
    }
    return database;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Get database
export const getDatabase = () => {
  if (!database) {
    initializeDatabase();
  }
  return database;
};

// Save database
export const saveDatabase = () => {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('Failed to save database:', error);
    throw error;
  }
};

// Generate ID
export const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Find helpers
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