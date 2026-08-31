// Note: This file defines the teamApi object, which provides methods for 
// interacting with team-related data, including CRUD operations and user retrieval.
import { readDB } from './db.js';
import { baseApi } from './baseApi.js';

export const teamApi = {
  getAll: () => readDB().teams || [],
  create: (data) => baseApi.post('teams', data),
  update: (id, data) => baseApi.put('teams', id, data),
  patch: (id, data) => baseApi.patch('teams', id, data),
  delete: (id) => baseApi.delete('teams', id),
  getById: (id) => readDB().teams.find(t => t.id === Number(id)),
  
  getUsersForTeam: () => readDB().users
    .filter(u => u.active && u.role !== 'admin')
    .map(({ id, name, role }) => ({ id, name, role }))
};