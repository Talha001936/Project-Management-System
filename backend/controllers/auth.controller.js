// Note: This file is used for backend authentication, it handles user login, 
// registration, token refresh, and logout functionalities.
import jwt from 'jsonwebtoken';
import { 
  getDatabase, 
  saveDatabase, 
  findUserByEmail,
  findUserById,  
  generateId,
  hashPassword,
  comparePassword 
} from '../services/db.service.js';
import { tokenBlacklist } from '../services/blacklist.service.js';
import { generateTokens, verifyRefreshToken, verifyAccessToken } from '../services/token.service.js';
import { createSession, findSessionByRefreshToken, invalidateRefreshToken, updateSessionActivity, invalidateSession } from '../services/session.service.js';

const JWT_SECRET = 'SecretAzanTalha123';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.active === false) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const { accessToken, refreshToken } = generateTokens(user);
    const session = createSession(user.id, accessToken, refreshToken);
    user.lastLogin = new Date().toISOString();
    await saveDatabase();

    const { password: _, ...userData } = user;
    res.json({ 
      token: accessToken,
      refreshToken,
      user: userData 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body;

    const db = getDatabase();
    
    if (db.users.some(u => u.email === email)) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);
    
    const newUser = {
      id: generateId(),
      name,
      email,
      password: hashedPassword,
      role,
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    db.users.push(newUser);
    await saveDatabase();

    const { password: _, ...userData } = newUser;
    res.status(201).json({ user: userData });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userData } = user;
    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      tokenBlacklist.add(token);
    }

    
    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
      invalidateRefreshToken(refreshToken);
    } else {
      
      invalidateSession(req.user.id);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

   
    const session = findSessionByRefreshToken(refreshToken);
    if (!session) {
      return res.status(401).json({ message: 'Session not found' });
    }

   
    if (new Date(session.expiresAt) < new Date()) {
      invalidateRefreshToken(refreshToken);
      return res.status(401).json({ message: 'Session expired' });
    }

   
    updateSessionActivity(refreshToken);

    
    const user = findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

   
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

   
    invalidateRefreshToken(refreshToken);

    
    createSession(user.id, accessToken, newRefreshToken);

    res.json({ 
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
};