import express from 'express';
import { 
  login, 
  register, 
  getCurrentUser, 
  logout, 
  refreshToken 
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validations/auth.validation.js';

const router = express.Router();

// Public routes
router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

export default router;