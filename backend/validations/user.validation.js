
import Joi from 'joi';


const simplePassword = /^.{8,}$/;

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string()
    .pattern(simplePassword)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    }),
  role: Joi.string().valid('admin', 'manager', 'employee').default('employee'),
  active: Joi.boolean().default(true)
});



export const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'manager', 'employee').required().messages({
    'any.required': 'Role is required',
    'any.only': 'Invalid role value'
  })
});

export const updateUserStatusSchema = Joi.object({
  active: Joi.boolean().required().messages({
    'any.required': 'Active status is required'
  })
});