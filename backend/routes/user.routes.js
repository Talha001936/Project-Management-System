
import express from 'express';
import {
  getAllUsers,
  getUsersForTeam,
  getAssignableUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorization.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { 
  createUserSchema, 
  updateUserRoleSchema, 
  updateUserStatusSchema 
} from '../validations/user.validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/for-team', authorize('admin', 'manager'), getUsersForTeam);
router.get('/assignable', getAssignableUsers);

router.get('/', authorize('admin'), getAllUsers);
router.post('/', authorize('admin'), validate(createUserSchema), createUser);

router.patch('/:id/role', authorize('admin'), validate(updateUserRoleSchema), updateUserRole);
router.patch('/:id/status', authorize('admin'), validate(updateUserStatusSchema), updateUserStatus);
router.delete('/:id', authorize('admin'), deleteUser);
export default router;