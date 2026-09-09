
import express from 'express';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskById 
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  authorize,
  checkResourceAccess  
} from '../middleware/authorization.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '../validations/task.validation.js';
import { USER_ROLE } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllTasks);

router.get('/:id', 
  checkResourceAccess('task'),
  getTaskById
);

router.post('/', 
  authorize(USER_ROLE.ADMIN, USER_ROLE.MANAGER), 
  validate(createTaskSchema), 
  createTask
);

router.put('/:id', 
  authorize(USER_ROLE.ADMIN, USER_ROLE.MANAGER),
  checkResourceAccess('task'),  
  validate(updateTaskSchema),
  updateTask
);

router.delete('/:id', 
  authorize(USER_ROLE.ADMIN, USER_ROLE.MANAGER),
  checkResourceAccess('task'),  
  deleteTask
);


router.patch('/:id/status', 
  checkResourceAccess('task'),  
  validate(updateTaskStatusSchema),
  updateTaskStatus
);

export default router;
