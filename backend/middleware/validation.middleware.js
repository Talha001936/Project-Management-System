import { errorResponse } from '../utils/response.js';
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return errorResponse(res, `Validation error: ${errors.map(e => e.message).join(', ')}`, 400);
    }

    req.body = value;
    next();
  };
};
export const validationMiddleware = validate;
