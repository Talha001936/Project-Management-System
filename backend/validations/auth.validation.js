
import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must contain at least 8 characters',
    'any.required': 'Password is required'
  }),
  role: Joi.forbidden()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});
