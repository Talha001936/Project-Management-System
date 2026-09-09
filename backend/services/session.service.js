// note this service i used to crate and cleanup sessions
import { getDatabase, saveDatabase, generateId } from './db.service.js';
import { tokenBlacklist } from './blacklist.service.js';

export const createSession = (userId, accessToken, refreshToken) => {
  const db = getDatabase();
  
  if (!db.sessions) db.sessions = [];

  const session = {
    id: generateId(),
    userId,
    accessToken,
    refreshToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), 
    isActive: true
  };

  db.sessions.push(session);
  saveDatabase();
  
  return session;
};

export const invalidateAllUserSessions = (userId) => {
  const db = getDatabase();
  if (!db.sessions) return;
  
  const userSessions = db.sessions.filter(s => s.userId === userId);
  
  userSessions.forEach(session => {
    if (session.accessToken) tokenBlacklist.add(session.accessToken);
    if (session.refreshToken) tokenBlacklist.add(session.refreshToken);
  });
  
  db.sessions = db.sessions.filter(s => s.userId !== userId);
  saveDatabase();
};

export const invalidateSessionByToken = (accessToken) => {
  const db = getDatabase();
  if (!db.sessions) return;
  
  const session = db.sessions.find(s => s.accessToken === accessToken);
  if (session) {
    if (session.refreshToken) tokenBlacklist.add(session.refreshToken);
    db.sessions = db.sessions.filter(s => s.accessToken !== accessToken);
    saveDatabase();
  }
};

export const cleanupExpiredSessions = () => {
  const db = getDatabase();
  if (!db.sessions) return;
  
  const now = new Date();
  const expiredSessions = db.sessions.filter(s => new Date(s.expiresAt) <= now);
  
  expiredSessions.forEach(session => {
    if (session.accessToken) tokenBlacklist.add(session.accessToken);
    if (session.refreshToken) tokenBlacklist.add(session.refreshToken);
  });
  
  db.sessions = db.sessions.filter(s => new Date(s.expiresAt) > now);
  if (expiredSessions.length > 0) saveDatabase();
};

export const getActiveSessions = (userId) => {
  const db = getDatabase();
  if (!db.sessions) return [];
  
  return db.sessions.filter(s => s.userId === userId && s.isActive === true);
};
