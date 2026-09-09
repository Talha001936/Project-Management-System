
import Joi from 'joi';
import { USER_ROLE } from '../utils/constants.js';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid(USER_ROLE.MANAGER, USER_ROLE.EMPLOYEE).default(USER_ROLE.EMPLOYEE),
  active: Joi.boolean().default(true)
});

export const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid(USER_ROLE.MANAGER, USER_ROLE.EMPLOYEE).required()
});

export const updateUserStatusSchema = Joi.object({
  active: Joi.boolean().required()
});
