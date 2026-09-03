//Note : This service manages user sessions in the application. It provides functions to create,
//  find, update, and invalidate sessions. Sessions are stored in a JSON file that acts as a simple d
// atabase. The service also includes a cleanup function to remove expired sessions.
import { getDatabase, saveDatabase } from './db.service.js';

export const createSession = (userId, token, refreshToken) => {
  const db = getDatabase();
  
  if (!db.sessions) {
    db.sessions = [];
  }

  // Remove existing sessions for this user
  db.sessions = db.sessions.filter(s => s.userId !== userId);

  // Create new session
  const session = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    userId,
    token,
    refreshToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    lastActivity: new Date().toISOString()
  };

  db.sessions.push(session);
  saveDatabase();
  
  return session;
};

export const findSessionByRefreshToken = (refreshToken) => {
  const db = getDatabase();
  if (!db.sessions) return null;
  
  return db.sessions.find(s => s.refreshToken === refreshToken);
};

export const updateSessionActivity = (refreshToken) => {
  const db = getDatabase();
  if (!db.sessions) return null;
  
  const session = db.sessions.find(s => s.refreshToken === refreshToken);
  if (session) {
    session.lastActivity = new Date().toISOString();
    saveDatabase();
    return session;
  }
  return null;
};

export const invalidateSession = (userId) => {
  const db = getDatabase();
  if (!db.sessions) return;
  
  db.sessions = db.sessions.filter(s => s.userId !== userId);
  saveDatabase();
};

export const invalidateRefreshToken = (refreshToken) => {
  const db = getDatabase();
  if (!db.sessions) return;
  
  db.sessions = db.sessions.filter(s => s.refreshToken !== refreshToken);
  saveDatabase();
};

export const cleanupExpiredSessions = () => {
  const db = getDatabase();
  if (!db.sessions) return;
  
  const now = new Date();
  db.sessions = db.sessions.filter(s => new Date(s.expiresAt) > now);
  saveDatabase();
};