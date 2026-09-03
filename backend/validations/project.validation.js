import Joi from 'joi';

export const createProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Project name must be at least 3 characters',
    'string.max': 'Project name cannot exceed 100 characters',
    'any.required': 'Project name is required'
  }),
  description: Joi.string().max(500).allow('').optional(),
  managerId: Joi.number().integer().positive().required().messages({
    'number.base': 'Manager ID must be a number',
    'any.required': 'Manager ID is required'
  }),
  teamIds: Joi.array().items(Joi.number().integer().positive()).default([]),
  individualMembers: Joi.array().items(Joi.number().integer().positive()).default([]),
  status: Joi.string().valid('active', 'completed', 'archived').default('active'),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium')
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).allow('').optional(),
  managerId: Joi.number().integer().positive().optional(),
  teamIds: Joi.array().items(Joi.number().integer().positive()).optional(),
  individualMembers: Joi.array().items(Joi.number().integer().positive()).optional(),
  status: Joi.string().valid('active', 'completed', 'archived').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional()
});