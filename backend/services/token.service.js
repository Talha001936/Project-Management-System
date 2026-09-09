
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY, NODE_ENV } from '../utils/constants.js';


export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'refresh') return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const getCookieOptions = (maxAge = 15 * 60 * 1000) => {
  
  return {
    httpOnly: true,
    sameSite: 'strict',
    maxAge,
    path: '/',
  };
};
