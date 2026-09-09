//Note : this controller is used for crud operaion for tasks and 
import {
  getDatabase,
  saveDatabase,
  generateId,
  findTaskById,
  findProjectById,
  findUserById,
  findTeamById
} from '../services/db.service.js';
import { USER_ROLE, TASK_STATUS } from '../utils/constants.js';
import { successResponse, errorResponse } from '../utils/response.js';

const getTaskPermissions = (task, userId, role, db) => {
  const project = db.projects.find(p => p.id === task.projectId);

  if (role === USER_ROLE.ADMIN) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canUpdateStatus: false,
      canReassign: true,
      canCreate: true,
      role: 'admin'
    };
  }

  const isProjectManager = project && project.managerId === userId;
  const isAssignee = task.assigneeId === userId;
  const isCreator = task.createdBy === userId;

  if (role === USER_ROLE.MANAGER) {
    if (isProjectManager || isCreator) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canUpdateStatus: isAssignee,
        canCreate: true,
        role: 'manager_owner',
        canReassign: true,
      };
    }

    if (isAssignee) {
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canUpdateStatus: true,
        canReassign: false,
        canCreate: false,
        role: 'manager_assignee'
      };
    }

    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canUpdateStatus: false,
      canReassign: false,
      canCreate: false,
      role: 'none'
    };
  }

  if (role === USER_ROLE.EMPLOYEE) {
    if (isAssignee) {
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canUpdateStatus: true,
        canReassign: false,
        canCreate: false,
        role: 'employee_assignee'
      };
    }

    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canUpdateStatus: false,
      canReassign: false,
      canCreate: false,
      role: 'none'
    };
  }

  return {
    canView: false,
    canEdit: false,
    canDelete: false,
    canUpdateStatus: false,
    canReassign: false,
    canCreate: false,
    role: 'none'
  };
};

export const getAllTasks = async (req, res) => {
  try {
    const db = getDatabase();
    const { role, id: userId } = req.user;

    let tasks = db.tasks;

    if (role === USER_ROLE.ADMIN) {
      tasks = db.tasks;
    } else if (role === USER_ROLE.MANAGER) {
      const managedProjectIds = db.projects
        .filter(p => p.managerId === userId)
        .map(p => p.id);

      tasks = db.tasks.filter(t =>
        managedProjectIds.includes(t.projectId) ||
        t.assigneeId === userId ||
        t.createdBy === userId
      );
    } else if (role === USER_ROLE.EMPLOYEE) {
      tasks = db.tasks.filter(t => t.assigneeId === userId);
    }

    const tasksWithDetails = tasks.map(task => {
      const permissions = getTaskPermissions(task, userId, role, db);
      return {
        ...task,
        project: db.projects.find(p => p.id === task.projectId),
        assignee: db.users.find(u => u.id === task.assigneeId),
        createdBy: db.users.find(u => u.id === task.createdBy),
        permissions
      };
    });

    return successResponse(res, 'Tasks fetched successfully', tasksWithDetails);
  } catch (error) {
    console.error('get tasks error:', error);
    return errorResponse(res, 'Failed to get tasks', 500);
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = findTaskById(parseInt(id));
    
    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }

    const db = getDatabase();
    const project = findProjectById(task.projectId);
    const permissions = getTaskPermissions(task, req.user.id, req.user.role, db);

    if (!permissions.canView) {
      return errorResponse(res, 'You do not have permission to view this task', 403);
    }

    const taskWithDetails = {
      ...task,
      project: project,
      assignee: db.users.find(u => u.id === task.assigneeId),
      createdBy: db.users.find(u => u.id === task.createdBy),
      permissions
    };

    return successResponse(res, 'Task fetched successfully', taskWithDetails);
  } catch (error) {
    console.error('get task error:', error);
    return errorResponse(res, 'Failed to get task', 500);
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, priority = 'medium' } = req.body;
    const { id: userId, role } = req.user;

    const project = findProjectById(parseInt(projectId));
    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    if (role !== USER_ROLE.ADMIN && role !== USER_ROLE.MANAGER) {
      return errorResponse(res, 'You do not have permission to create tasks', 403);
    }

    if (role === USER_ROLE.MANAGER && project.managerId !== userId) {
      return errorResponse(res, 'You can only create tasks in projects you manage', 403);
    }

    const assignee = findUserById(parseInt(assigneeId));
    if (!assignee) {
      return errorResponse(res, 'Assignee not found', 404);
    }

    if (assignee.active === false) {
      return errorResponse(res, 'Cannot assign task to inactive user', 400);
    }

    const isAssigneeInProject =
      project.individualMembers?.includes(assignee.id) ||
      project.teamIds?.some(teamId => {
        const team = findTeamById(teamId);
        return team?.members?.includes(assignee.id);
      });

    if (!isAssigneeInProject && role !== USER_ROLE.ADMIN) {
      return errorResponse(res, 'Assignee must be a member of the project', 400);
    }

    const task = {
      id: generateId(),
      title: title.trim(),
      description: description?.trim() || '',
      projectId: parseInt(projectId),
      assigneeId: parseInt(assigneeId),
      createdBy: userId,
      status: TASK_STATUS.TODO,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = getDatabase();
    db.tasks.push(task);
    await saveDatabase();

    return successResponse(res, 'Task created successfully', task);
  } catch (error) {
    console.error('create task error:', error);
    return errorResponse(res, 'Failed to create task', 500);
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigneeId, priority } = req.body;
    const { role, id: userId } = req.user;

    const task = findTaskById(parseInt(id));
    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }

    const db = getDatabase();
    const permissions = getTaskPermissions(task, userId, role, db);

    // STRICT permission check
    if (!permissions.canEdit) {
      return errorResponse(res, 'You do not have permission to edit this task', 403);
    }

    if (task.status === 'done') {
      return errorResponse(res, 'Cannot edit completed tasks', 400);
    }

    if (title) {
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (priority) {
      task.priority = priority;
    }

    if (assigneeId) {
      // Only project manager or admin can reassign
      if (!permissions.canReassign) {
        return errorResponse(res, 'Only admin or project manager can reassign tasks', 403);
      }

      const assignee = findUserById(parseInt(assigneeId));
      if (!assignee) {
        return errorResponse(res, 'Assignee not found', 404);
      }
      if (assignee.active === false) {
        return errorResponse(res, 'Cannot assign to inactive user', 400);
      }

      const project = findProjectById(task.projectId);
      const isInProject =
        project.individualMembers?.includes(assignee.id) ||
        project.teamIds?.some(teamId => {
          const team = findTeamById(teamId);
          return team?.members?.includes(assignee.id);
        });

      if (!isInProject && role !== 'admin') {
        return errorResponse(res, 'Assignee must be a member of the project', 400);
      }
      task.assigneeId = parseInt(assigneeId);
    }

    task.updatedAt = new Date().toISOString();
    await saveDatabase();

    return successResponse(res, 'Task updated successfully', task);
  } catch (error) {
    console.error('update task error:', error);
    return errorResponse(res, 'Failed to update task', 500);
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const task = findTaskById(parseInt(id));
    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }

    const db = getDatabase();
    const permissions = getTaskPermissions(task, userId, role, db);

    if (!permissions.canDelete) {
      return errorResponse(res, 'You do not have permission to delete this task', 403);
    }

    if (task.status === TASK_STATUS.DONE) {
      return errorResponse(res, 'Cannot delete completed tasks', 400);
    }

    db.tasks = db.tasks.filter(t => t.id !== task.id);
    await saveDatabase();

    return successResponse(res, 'Task deleted successfully');
  } catch (error) {
    console.error('delete task error:', error);
    return errorResponse(res, 'Failed to delete task', 500);
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, id: userId } = req.user;

    const task = findTaskById(parseInt(id));
    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }

    const project = findProjectById(task.projectId);
    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    const db = getDatabase();
    const permissions = getTaskPermissions(task, userId, role, db);

    if (!permissions.canUpdateStatus) {
      return errorResponse(res, 'You do not have permission to update this task status', 403);
    }

    if (task.status === TASK_STATUS.DONE && status !== TASK_STATUS.DONE) {
      return errorResponse(res, 'Cannot change status of completed tasks', 400);
    }

    const allowedTransitions = {
      [TASK_STATUS.TODO]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.REVIEW, TASK_STATUS.DONE],
      [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.TODO, TASK_STATUS.REVIEW, TASK_STATUS.DONE],
      [TASK_STATUS.REVIEW]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE, TASK_STATUS.TODO],
      [TASK_STATUS.DONE]: [TASK_STATUS.DONE]
    };

    const allowed = allowedTransitions[task.status] || [];
    if (!allowed.includes(status) && task.status !== status) {
      return errorResponse(res, `Cannot transition from "${task.status}" to "${status}". Allowed: ${allowed.join(', ')}`, 400);
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (status === TASK_STATUS.DONE && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }

    await saveDatabase();

    return successResponse(res, `Task status updated to "${status}"`, task);
  } catch (error) {
    console.error('update task status error:', error);
    return errorResponse(res, 'Failed to update task status', 500);
  }
};
