import Joi from 'joi';

export const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  members: Joi.array().items(Joi.number().integer().positive()).min(1).required()
    .messages({
      'array.min': 'Team must have at least one member'
    }),
  leaderId: Joi.number().integer().positive().required()
});

export const updateTeamSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  members: Joi.array().items(Joi.number().integer().positive()).min(1).optional()
    .messages({
      'array.min': 'Team must have at least one member'
    }),
  leaderId: Joi.number().integer().positive().optional()
});
