import Joi from 'joi';

export const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Team name must be at least 2 characters',
    'string.max': 'Team name cannot exceed 50 characters',
    'any.required': 'Team name is required'
  }),
  members: Joi.array().items(Joi.number().integer().positive()).default([]),
  leaderId: Joi.number().integer().positive().required().messages({
    'number.base': 'Leader ID must be a number',
    'any.required': 'Team leader is required'
  })
});

export const updateTeamSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  members: Joi.array().items(Joi.number().integer().positive()).optional(),
  leaderId: Joi.number().integer().positive().optional()
});