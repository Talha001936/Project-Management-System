// Note: This file defines a function to create request and response interceptors for API calls, allowing for pre-processing of requests and post-processing of responses.
export const createInterceptors = () => {
  let requestInterceptors = [];
  let responseInterceptors = [];

  const processRequest = (config) => {
    let { url, data, headers } = config;
    for (const interceptor of requestInterceptors) {
      const result = interceptor({ url, headers, data });
      if (result) {
        url = result.url || url;
        data = result.data || data;
      }
    }
    return { url, data, headers };
  };

  const processResponse = (response) => {
    for (const interceptor of responseInterceptors) {
      interceptor.callback?.(response);
    }
    return response;
  };

  const processError = (error) => {
    for (const interceptor of responseInterceptors) {
      interceptor.errorCallback?.(error);
    }
    throw error;
  };

  return {
    request: {
      use: (callback) => {
        requestInterceptors.push(callback);
        return { eject: () => {} };
      },
      eject: () => {}
    },
    response: {
      use: (callback, errorCallback) => {
        responseInterceptors.push({ callback, errorCallback });
        return { eject: () => {} };
      },
      eject: () => {}
    },
    processRequest,
    processResponse,
    processError
  };
};