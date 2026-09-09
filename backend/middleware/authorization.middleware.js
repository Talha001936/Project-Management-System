// Note: This middleware is used to authorize requests based on user roles. It 
// checks if the authenticated user has the required role to access a specific 
// route. If the user does not have the required role, it responds with a 403 Forbidden status.
import { errorResponse, unauthorizeResponse } from '../utils/response.js';
import { USER_ROLE } from '../utils/constants.js';
import { getDatabase } from '../services/db.service.js';
import { parseId } from '../utils/id.helper.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizeResponse(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res, 
        `Access denied. Required role: ${allowedRoles.join(' or ')}`, 
        403
      );
    }

    next();
  };
};

export const checkResourceAccess = (resourceType) => {
  return (req, res, next) => {
    try {
      const { id: userId, role } = req.user;
      
      
      const resourceId = req.params.id ? parseId(req.params.id) : null;
      
      if (!resourceId) {
        return errorResponse(res, `${resourceType} ID is required`, 400);
      }

      const db = getDatabase();
      let resource;
      
      switch(resourceType) {
        case 'project': {
          resource = db.projects.find(p => p.id === resourceId);
          break;
        }
        case 'task': {
          resource = db.tasks.find(t => t.id === resourceId);
          break;
        }
        case 'team': {
          resource = db.teams.find(t => t.id === resourceId);
          break;
        }
        default:
          return errorResponse(res, 'Invalid resource type', 400);
      }

      if (!resource) {
        return errorResponse(res, `${resourceType} not found`, 404);
      }

      // Admin always has access
      if (role === USER_ROLE.ADMIN) {
        req.resource = resource;
        req.permissionType = 'manage';
        return next();
      }

      let hasAccess = false;
      let permissionType = 'view';
      
      switch(resourceType) {
        case 'project': {
          if (role === USER_ROLE.MANAGER) {
            hasAccess = resource.managerId === userId;
            if (hasAccess) permissionType = 'manage';
          }
          
          if (role === USER_ROLE.EMPLOYEE || (role === USER_ROLE.MANAGER && !hasAccess)) {
            const userTeams = db.teams.filter(t => t.members?.includes(userId));
            const teamIds = userTeams.map(t => t.id);
            
            hasAccess = resource.individualMembers?.includes(userId) ||
                        resource.teamIds?.some(id => teamIds.includes(id));
            if (hasAccess) permissionType = 'view';
          }
          break;
        }
        case 'task': {
          const project = db.projects.find(p => p.id === resource.projectId);
          
          if (role === USER_ROLE.MANAGER) {
            const isProjectManager = project && project.managerId === userId;
            const isCreator = resource.createdBy === userId;
            
            hasAccess = isProjectManager || isCreator || resource.assigneeId === userId;
            
            if (hasAccess) {
              permissionType = isProjectManager || isCreator ? 'manage' : 'view';
            }
          }
          
          if (role === USER_ROLE.EMPLOYEE) {
            hasAccess = resource.assigneeId === userId;
            permissionType = hasAccess ? 'view' : 'none';
          }
          break;
        }
        case 'team': {
          if (role === USER_ROLE.EMPLOYEE) {
            hasAccess = false;
            break;
          }
          
          if (role === USER_ROLE.MANAGER) {
            if (resource.leaderId === userId) {
              hasAccess = true;
              permissionType = 'manage';
            } else if (resource.members?.includes(userId)) {
              hasAccess = true;
              permissionType = 'view';
            }
          }
          break;
        }
      }

      if (!hasAccess) {
        return errorResponse(res, 'Access denied to this resource', 403);
      }

      req.resource = resource;
      req.permissionType = permissionType;
      next();
    } catch (error) {
      console.error('resource access error:', error);
      return errorResponse(res, error.message || 'Access check failed', 500);
    }
  };
};
