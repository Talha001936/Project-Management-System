// Note: This file defines the userApi object, which provides methods for 
// interacting with user-related data, including CRUD operations and role/status updates.
import { readDB, writeDB } from './db.js';
import { baseApi } from './baseApi.js';

const filterActiveNonAdmin = (users) => 
  users.filter(u => u.active && u.role !== 'admin');

const findUser = (id) => {
  const user = readDB().users.find(u => u.id === Number(id));
  if (!user) throw new Error('Not found');
  return user;
};

export const userApi = {
  getAll: () => readDB().users.map(({ id, name, email, role, active }) => ({ id, name, email, role, active })),
  
  getForTeam: () => filterActiveNonAdmin(readDB().users).map(({ id, name, role }) => ({ id, name, role })),
  
  getAssignable: () => filterActiveNonAdmin(readDB().users).map(({ id, name, role }) => ({ id, name, role })),

  updateRole: (id, role) => {
    const db = readDB();
    const user = findUser(id);
    user.role = role;
    writeDB(db);
    return user;
  },

  updateStatus: (id, active) => {
    const db = readDB();
    const user = findUser(id);
    user.active = active;
    writeDB(db);
    return user;
  },

  create: (data) => baseApi.post('users', data),
  update: (id, data) => baseApi.put('users', id, data),
  delete: (id) => baseApi.delete('users', id),
  getById: (id) => readDB().users.find(u => u.id === Number(id))
};