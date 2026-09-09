
import express from 'express';
import {
  login,
  register,
  logout,
  refreshToken,
  getMe
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validations/auth.validation.js';

const router = express.Router();


router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
