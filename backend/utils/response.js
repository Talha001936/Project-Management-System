
const response = (res, statusCode, success, message, data) => {
  return res.status(statusCode).json({
    success,
    statusCode,
    message,
    data,
  });
};

export const successResponse = (res, message, data = {}) => {
  return response(res, 200, true, message, data);
};

export const errorResponse = (res, message = "Server Error", status = 500) => {
  return response(res, status, false, message);
};

export const unauthorizeResponse = (res, message = "Unauthorized", status = 401) => {
  return response(res, status, false, message);
};