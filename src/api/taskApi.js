// Note: This file defines the taskApi object, which provides methods for 
// interacting with task-related data, including CRUD operations and status updates.
import { readDB, writeDB } from './db.js';
import { baseApi } from './baseApi.js';

export const taskApi = {
  getAll: () => readDB().tasks || [],
  create: (data) => baseApi.post('tasks', data),
  update: (id, data) => baseApi.put('tasks', id, data),
  patch: (id, data) => baseApi.patch('tasks', id, data),
  delete: (id) => baseApi.delete('tasks', id),
  getById: (id) => readDB().tasks.find(t => t.id === Number(id)),
  
  updateStatus: (id, status) => {
    const db = readDB();
    const task = db.tasks.find(t => t.id === Number(id));
    if (!task) throw new Error('Not found');
    task.status = status;
    task.updatedAt = new Date().toISOString();
    writeDB(db);
    return task;
  }
};