//Note: This service manages JWT tokens for authentication and authorization. It provides 
// functions to generate, verify, and decode access and refresh tokens. The service uses 
// a secret key for signing the tokens and supports configurable expiration times for both 
// access and refresh tokens.
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = 'SecretAzanTalha123';
const JWT_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  // Generate access token
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
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
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

