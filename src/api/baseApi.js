//Note this api help in read and write data in db.json file. It is used to mock the backend api calls.
import { readDB, writeDB, generateId } from './db.js';

const getResource = (resource) => readDB()[resource] || [];

const findIndex = (resource, id) => {
  const items = getResource(resource);
  const idx = items.findIndex(i => i.id === Number(id));
  if (idx === -1) throw new Error('Not found');
  return idx;
};

export const baseApi = {
  get: (resource) => getResource(resource),

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
    const idx = findIndex(resource, id);
    db[resource][idx] = { ...db[resource][idx], ...data, id: Number(id) };
    writeDB(db);
    return db[resource][idx];
  },

  patch: (resource, id, data) => {
    const db = readDB();
    const idx = findIndex(resource, id);
    db[resource][idx] = { ...db[resource][idx], ...data, id: Number(id) };
    writeDB(db);
    return db[resource][idx];
  },

  delete: (resource, id) => {
    const db = readDB();
    db[resource] = db[resource].filter(i => i.id !== Number(id));
    writeDB(db);
    return true;
  }
};