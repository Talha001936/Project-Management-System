// Note: This file is used for backend authentication, it handles user login, 
// registration, token refresh, and logout functionalities.
import {
  getDatabase,
  saveDatabase,
  findUserByEmail,
  findUserById,
  hashPassword,
  comparePassword
} from '../services/db.service.js';
import { tokenBlacklist } from '../services/blacklist.service.js';
import {
  generateTokens,
  verifyRefreshToken,
  getCookieOptions
} from '../services/token.service.js';
import {
  createSession,
  invalidateAllUserSessions,
  invalidateSessionByToken
} from '../services/session.service.js';
import { USER_ROLE } from '../utils/constants.js';
import { successResponse, errorResponse, unauthorizeResponse } from '../utils/response.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const db = getDatabase();

    if (db.users.some(u => u.email === email)) {
      return errorResponse(res, 'Email already registered', 400);
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name,
      email,
      password: hashedPassword,
      role: USER_ROLE.EMPLOYEE,
      active: false,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    db.users.push(newUser);
    await saveDatabase();

    const userData = { ...newUser };
    delete userData.password;
    return successResponse(res, 'User registered successfully', userData);
  } catch (error) {
    console.error('registration error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = findUserByEmail(email);
    if (!user) {
      return unauthorizeResponse(res, 'User not found');
    }

    if (user.active === false) {
      return errorResponse(res, 'Account is deactivated. Please contact admin.', 403);
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return unauthorizeResponse(res, 'Invalid credentials');
    }

    await invalidateAllUserSessions(user.id);

    const { accessToken, refreshToken } = generateTokens(user);
    createSession(user.id, accessToken, refreshToken);

    user.lastLogin = new Date().toISOString();
    await saveDatabase();

    const userData = { ...user };
    delete userData.password;

    const accessCookieOptions = getCookieOptions(15 * 60 * 1000);
    const refreshCookieOptions = getCookieOptions(7 * 24 * 60 * 60 * 1000);

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return successResponse(res, 'Login successful', { user: userData });
  } catch (error) {
    console.error('login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    if (token) {
      tokenBlacklist.add(token);
      invalidateSessionByToken(token);
    }

    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      tokenBlacklist.add(refreshToken);
    }

    res.clearCookie('accessToken', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict'
    });
    res.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict'
    });

    return successResponse(res, 'Logged out successfully');
  } catch (error) {
    console.error('logout error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return unauthorizeResponse(res, 'Refresh token not found');
    }

    if (tokenBlacklist.isBlacklisted(refreshToken)) {
      return unauthorizeResponse(res, 'Refresh token has been invalidated');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return unauthorizeResponse(res, 'Invalid refresh token');
    }

    const user = findUserById(decoded.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.active === false) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    const db = getDatabase();
    
    const oldSession = db.sessions.find(s => s.refreshToken === refreshToken);
    if (oldSession) {
      
      db.sessions = db.sessions.filter(s => s.id !== oldSession.id);
      await saveDatabase();
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    createSession(user.id, accessToken, newRefreshToken);

    const accessCookieOptions = getCookieOptions(15 * 60 * 1000);
    const refreshCookieOptions = getCookieOptions(7 * 24 * 60 * 60 * 1000);

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    return successResponse(res, 'Token refreshed successfully', {
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('refresh token error:', error);
    return errorResponse(res, 'Failed to refresh token', 500);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = findUserById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const db = getDatabase();

    const stats = {
      totalTasks: db.tasks.filter(t => t.assigneeId === user.id).length,
      completedTasks: db.tasks.filter(t => t.assigneeId === user.id && t.status === 'done').length,
      projects: db.projects.filter(p =>
        p.individualMembers?.includes(user.id) ||
        p.teamIds?.some(teamId => {
          const team = db.teams.find(t => t.id === teamId);
          return team?.members?.includes(user.id);
        })
      ).length,
      teams: db.teams.filter(t =>
        t.members?.includes(user.id) ||
        t.leaderId === user.id
      ).length
    };

    const userData = { ...user };
    delete userData.password;
    return successResponse(res, 'User fetched successfully', {
      ...userData,
      stats
    });
  } catch (error) {
    console.error('get user error:', error);
    return errorResponse(res, 'Failed to get user', 500);
  }
};
