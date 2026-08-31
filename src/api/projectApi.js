// Note: This file defines the projectApi object, which provides methods 
// for interacting with project-related data, including CRUD operations and user/team retrieval.
import { readDB } from './db.js';
import { baseApi } from './baseApi.js';

const filterActiveNonAdmin = (users) => 
  users.filter(u => u.active && u.role !== 'admin');

export const projectApi = {
  getAll: () => readDB().projects || [],
  create: (data) => baseApi.post('projects', data),
  update: (id, data) => baseApi.put('projects', id, data),
  patch: (id, data) => baseApi.patch('projects', id, data),
  delete: (id) => baseApi.delete('projects', id),
  getById: (id) => readDB().projects.find(p => p.id === Number(id)),
  
  // Return all users with complete data
  getAllUsers: () => readDB().users.map(({ id, name, email, role, active }) => ({ 
    id, 
    name, 
    email, 
    role, 
    active 
  })),
  
  getAllTeams: () => readDB().teams,
  
  getAssignableUsers: () => filterActiveNonAdmin(readDB().users).map(({ id, name, role }) => ({ 
    id, 
    name, 
    role 
  })),
  
  getUsersForTeam: () => filterActiveNonAdmin(readDB().users).map(({ id, name, role }) => ({ 
    id, 
    name, 
    role 
  }))
};