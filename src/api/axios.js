
import { loadDB } from './db.js';
import { authApi } from './authApi.js';
import { userApi } from './userApi.js';
import { projectApi } from './projectApi.js';
import { taskApi } from './taskApi.js';
import { teamApi } from './teamApi.js';
import { createInterceptors } from './interceptors.js';

// Initialize database
loadDB();

const interceptors = createInterceptors();

//Note: route definitions for all the special endpoints that don't fit the standard CRUD pattern
const routeHandlers = {
  // Note: multiple routes can be defined here, each with its own handler function
  '/auth/me': async () => {
    const result = await authApi.me();
    return { data: result };
  },
  '/auth/login': async (data) => {
    const result = await authApi.login(data);
    return { data: { token: 'mock-token', user: result.user } };
  },
  '/auth/register': async (data) => {
    const result = await authApi.register(data);
    return { data: { token: 'mock-token', user: result.user } };
  },
  
 
  '/users/:id/role': (data, id) => ({ data: userApi.updateRole(id, data.role) }),
  
  
  '/users/:id/status': (data, id) => ({ data: userApi.updateStatus(id, data.active) }),
  '/tasks/:id/status': (data, id) => ({ data: taskApi.updateStatus(id, data.status) }),
  
 
  '/projects/all-users': () => ({ data: projectApi.getAllUsers() }),
  '/projects/all-teams': () => ({ data: projectApi.getAllTeams() }),
  '/projects/assignable-users': () => ({ data: projectApi.getAssignableUsers() }),
  '/users/for-team': () => ({ data: userApi.getForTeam() }),
};


const crudHandlers = {
  users: userApi,
  projects: projectApi,
  tasks: taskApi,
  teams: teamApi,
};

const getResourceAndId = (url) => {
  const parts = url.split('/').filter(Boolean);
  const resource = parts[0];
  const id = parts[1];
  return { resource, id };
};

const handleRequest = async (method, url, data) => {
  const token = localStorage.getItem('pms_token');
  const isAuthRoute = url.includes('/auth');
  
  // Note: allow GET requests to auth/me without token (for validation)
  const isAuthMe = url === '/auth/me';
  
  if (!token && !isAuthRoute && !isAuthMe) {
    throw { response: { status: 401, data: { message: 'No token' } } };
  }

  
  const processed = interceptors.processRequest({ url, headers: {}, data });
  url = processed.url;
  data = processed.data;

  try {
   
    for (const [route, handler] of Object.entries(routeHandlers)) {
      const pattern = route.replace(/:\w+/g, '([^/]+)');
      const match = url.match(new RegExp(`^${pattern}$`));
      if (match) {
        const id = match[1];
        const result = await handler(data, id);
        return interceptors.processResponse(result);
      }
    }

    // Handle CRUD operations
    const { resource, id } = getResourceAndId(url);
    const api = crudHandlers[resource];
    
    if (!api) {
      return interceptors.processResponse({ data: null });
    }

    let result;
    switch (method) {
      case 'get': 
        result = { data: api.getAll() }; 
        break;
      case 'post': 
        result = { data: api.create(data) }; 
        break;
      case 'put': 
        result = { data: api.update(id, data) }; 
        break;
      case 'patch': 
        result = { data: api.patch(id, data) }; 
        break;
      case 'delete': 
       
        api.delete(id);
        result = { data: null, status: 204 }; 
        break;
      default: 
        result = { data: null };
    }

    return interceptors.processResponse(result);
  } catch (error) {
    return interceptors.processError(error);
  }
};

// Create API client
function createApi() {
  const methods = ['get', 'post', 'put', 'patch', 'delete'];
  const api = {};

  methods.forEach(method => {
    api[method] = async (url, data) => {
      try {
        return await handleRequest(method, url, data);
      } catch (error) {
        throw error;
      }
    };
  });

 
  api.interceptors = {
    request: {
      use: interceptors.request.use,
      eject: interceptors.request.eject
    },
    response: {
      use: interceptors.response.use,
      eject: interceptors.response.eject
    }
  };

  return api;
}

const api = createApi();
export default api;