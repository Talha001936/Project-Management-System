//Note: this api help in gnerte ids, read and check hashed password
import bcrypt from 'bcryptjs';
import dbData from '../db.json?url';

let db = null;

export const loadDB = async () => {
  if (db) return db;
  
  try {
    const response = await fetch(dbData);
    const data = await response.json();
    const savedDB = localStorage.getItem('pms_db');
    db = savedDB ? JSON.parse(savedDB) : data;
    if (!savedDB) localStorage.setItem('pms_db', JSON.stringify(db));
    return db;
  } catch (error) {
    console.error('Error loading database:', error);
    const savedDB = localStorage.getItem('pms_db');
    db = savedDB ? JSON.parse(savedDB) : { users: [], teams: [], projects: [], tasks: [] };
    return db;
  }
};

export const readDB = () => db;
export const writeDB = (newData) => {
  db = newData;
  localStorage.setItem('pms_db', JSON.stringify(db));
};

export const generateId = () => Date.now();

export const verifyPassword = async (inputPassword, storedPassword) => {
  if (!storedPassword) return false;
  
  // If it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(inputPassword, storedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
  
  // Fallback for plain text passwords (for backward compatibility)
  return inputPassword === storedPassword;
};

export const hashPassword = async (plainPassword) => {
  const saltRounds = 8;
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(plainPassword, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};