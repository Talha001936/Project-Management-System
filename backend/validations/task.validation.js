
import Joi from 'joi';
import { TASK_STATUS, TASK_PRIORITY } from '../utils/constants.js';

export const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).allow('').optional(),
  projectId: Joi.number().integer().positive().required(),
  assigneeId: Joi.number().integer().positive().required(),
  priority: Joi.string().valid(...Object.values(TASK_PRIORITY)).default('medium')
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).allow('').optional(),
  assigneeId: Joi.number().integer().positive().optional(),
  priority: Joi.string().valid(...Object.values(TASK_PRIORITY)).optional(),
  status: Joi.string().valid(...Object.values(TASK_STATUS)).optional()
});

export const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(TASK_STATUS)).required()
});
