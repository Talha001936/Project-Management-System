
import { tokenStorage } from './tokenStorage.js';

export const isTokenExpired = () => {
  const user = tokenStorage.getUser();
  return !user;
};

export const hasValidSession = () => {
  return !!tokenStorage.getUser();
};

export const clearSession = () => {
  tokenStorage.clear();
  
  if (window.__clearCache) {
    window.__clearCache();
  }
  if (window.clearAllCache) {
    window.clearAllCache();
  }
  
  const currentPath = window.location.pathname;
  if (!currentPath.includes('/login') && 
      !currentPath.includes('/register') &&
      !currentPath.includes('/unauthorized')) {
    window.location.replace('/login?session=expired');
  }
};

export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.role);
};

export const isAdmin = (user) => hasRole(user, 'admin');
export const isManager = (user) => hasRole(user, 'manager');
export const isAdminOrManager = (user) => hasRole(user, ['admin', 'manager']);
export const isEmployee = (user) => hasRole(user, 'employee');

export const canManageUsers = (user) => isAdmin(user);
export const canManageTeams = (user) => isAdmin(user);
export const canManageProjects = (user) => isAdminOrManager(user);
export const canCreateTasks = (user) => isAdminOrManager(user);
export const canViewAllUsers = (user) => isAdmin(user);
