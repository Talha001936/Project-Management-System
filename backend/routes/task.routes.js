import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorization.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '../validations/task.validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', authorize('admin', 'manager'), deleteTask);
router.patch('/:id/status', validate(updateTaskStatusSchema), updateTaskStatus);

export default router;