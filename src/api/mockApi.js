// Note: This file provides a mock API implementation for testing and development purposes, simulating backend API calls using local storage and a JSON database.
import { loadDB, readDB, writeDB, generateId, verifyPassword } from './db.js';

const filterActiveNonAdmin = (users) => 
  users.filter(u => u.active && u.role !== 'admin');

export const mockApi = {
  auth: {
    login: async ({ email, password }) => {
      await loadDB();
      const user = readDB().users.find(u => u.email === email);
      if (!user || !verifyPassword(password, user.password)) {
        throw new Error('Invalid credentials');
      }
      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    },
    register: async ({ name, email, password }) => {
      await loadDB();
      const db = readDB();
      if (db.users.some(u => u.email === email)) {
        throw new Error('Email exists');
      }
      const user = {
        id: generateId(),
        name,
        email,
        password,
        role: 'employee',
        active: true,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      writeDB(db);
      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    },
    me: async () => {
      const userData = localStorage.getItem('pms_user');
      if (!userData) throw new Error('No user found');
      return { user: JSON.parse(userData) };
    }
  },

  get: (resource) => readDB()[resource] || [],
  
  post: (resource, data) => {
    const db = readDB();
    const item = { id: generateId(), ...data, createdAt: new Date().toISOString() };
    if (!db[resource]) db[resource] = [];
    db[resource].push(item);
    writeDB(db);
    return item;
  },

  put: (resource, id, data) => {
    const db = readDB();
    const idx = db[resource].findIndex(i => i.id === Number(id));
    if (idx === -1) throw new Error('Not found');
    db[resource][idx] = { ...db[resource][idx], ...data, id: Number(id) };
    writeDB(db);
    return db[resource][idx];
  },

  patch: (resource, id, data) => {
    const db = readDB();
    const idx = db[resource].findIndex(i => i.id === Number(id));
    if (idx === -1) throw new Error('Not found');
    db[resource][idx] = { ...db[resource][idx], ...data, id: Number(id) };
    writeDB(db);
    return db[resource][idx];
  },

  delete: (resource, id) => {
    const db = readDB();
    db[resource] = db[resource].filter(i => i.id !== Number(id));
    writeDB(db);
    return true;
  },

  getAssignableUsers: () => filterActiveNonAdmin(readDB().users).map(({ id, name, role }) => ({ id, name, role })),
  
  getAllUsers: () => readDB().users.map(({ id, name, email, role, active }) => ({ id, name, email, role, active })),
  
  getAllTeams: () => readDB().teams,
  
  getUsersForTeam: () => filterActiveNonAdmin(readDB().users).map(({ id, name, role }) => ({ id, name, role })),

  updateUserRole: (id, role) => {
    const db = readDB();
    const user = db.users.find(u => u.id === Number(id));
    if (!user) throw new Error('Not found');
    user.role = role;
    writeDB(db);
    return user;
  },

  updateUserStatus: (id, active) => {
    const db = readDB();
    const user = db.users.find(u => u.id === Number(id));
    if (!user) throw new Error('Not found');
    user.active = active;
    writeDB(db);
    return user;
  },

  updateTaskStatus: (id, status) => {
    const db = readDB();
    const task = db.tasks.find(t => t.id === Number(id));
    if (!task) throw new Error('Not found');
    task.status = status;
    task.updatedAt = new Date().toISOString();
    writeDB(db);
    return task;
  }
};

loadDB();