import Joi from 'joi';

export const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Task title must be at least 3 characters',
    'string.max': 'Task title cannot exceed 200 characters',
    'any.required': 'Task title is required'
  }),
  description: Joi.string().max(1000).allow('').optional(),
  projectId: Joi.number().integer().positive().required().messages({
    'number.base': 'Project ID must be a number',
    'any.required': 'Project ID is required'
  }),
  assigneeId: Joi.number().integer().positive().required().messages({
    'number.base': 'Assignee ID must be a number',
    'any.required': 'Assignee ID is required'
  }),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  status: Joi.string().valid('todo', 'in-progress', 'review', 'done').default('todo')
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).allow('').optional(),
  assigneeId: Joi.number().integer().positive().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  status: Joi.string().valid('todo', 'in-progress', 'review', 'done').optional()
});

export const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid('todo', 'in-progress', 'review', 'done').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Invalid status value'
  })
});