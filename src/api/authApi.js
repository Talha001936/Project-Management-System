// Note: this api helps in generating ids, reading and checking hashed passwords
import { loadDB, readDB, writeDB, generateId, verifyPassword } from './db.js';

const createUserResponse = (user) => {
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
};

export const authApi = {
  login: async ({ email, password }) => {
    await loadDB();
    const user = readDB().users.find(u => u.email === email);
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    return createUserResponse(user);
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
      password, // This will be hashed by the API call
      role: 'employee',
      active: true,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    writeDB(db);
    return createUserResponse(user);
  },

  me: async () => {
    const userData = localStorage.getItem('pms_user');
    if (!userData) {
      throw new Error('No user found');
    }
    return { user: JSON.parse(userData) };
  }
};