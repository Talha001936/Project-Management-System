// routes/user.routes.js
import express from 'express';
import {
  getAllUsers,
  getAssignableUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getuserlist
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorization.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { 
  createUserSchema, 
  updateUserRoleSchema, 
  updateUserStatusSchema 
} from '../validations/user.validation.js';
import { USER_ROLE } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);


router.get('/', authorize(USER_ROLE.ADMIN), getAllUsers);
router.get('/public', getuserlist);
router.get('/assignable', getAssignableUsers);
router.post('/', authorize(USER_ROLE.ADMIN), validate(createUserSchema), createUser);
router.patch('/:id/role', authorize(USER_ROLE.ADMIN), validate(updateUserRoleSchema), updateUserRole);
router.patch('/:id/status', authorize(USER_ROLE.ADMIN), validate(updateUserStatusSchema), updateUserStatus);
router.delete('/:id', authorize(USER_ROLE.ADMIN), deleteUser);

export default router;
