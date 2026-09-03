// Note: Task controller with role-based access and task status management
import { 
  getDatabase, 
  saveDatabase, 
  generateId, 
  findTaskById, 
  findProjectById, 
  findUserById 
} from '../services/db.service.js';

// Get all tasks with role-based filtering
export const getAllTasks = async (req, res) => {
  try {
    const db = getDatabase();
    const { role, id: userId } = req.user;

    let tasks = db.tasks;

    if (role === 'employee') {
      tasks = tasks.filter(t => t.assigneeId === userId || t.createdBy === userId);
    } else if (role === 'manager') {
      const projectIds = db.projects
        .filter(p => p.managerId === userId)
        .map(p => p.id);
      
      tasks = tasks.filter(t => 
        projectIds.includes(t.projectId) || 
        t.assigneeId === userId ||
        t.createdBy === userId
      );
    }

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Failed to get tasks' });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = findTaskById(Number(id));
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Failed to get task' });
  }
};

// Create task (Any authenticated user)
export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, priority = 'medium' } = req.body;
    const { id: userId } = req.user;

    if (!title || !projectId || !assigneeId) {
      return res.status(400).json({ message: 'Title, project, and assignee are required' });
    }

    const project = findProjectById(Number(projectId));
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const assignee = findUserById(Number(assigneeId));
    if (!assignee) {
      return res.status(404).json({ message: 'Assignee not found' });
    }

    const db = getDatabase();
    const task = {
      id: generateId(),
      title,
      description: description || '',
      projectId: Number(projectId),
      assigneeId: Number(assigneeId),
      createdBy: userId,
      status: 'todo',
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.tasks.push(task);
    await saveDatabase();

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// Update task for admin, project manager, or assignee (status only)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigneeId, priority, status } = req.body;
    const { role, id: userId } = req.user;

    const task = findTaskById(Number(id));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = findProjectById(task.projectId);
    
    // Authorization check
    let canUpdate = false;
    if (role === 'admin') canUpdate = true;
    else if (project?.managerId === userId) canUpdate = true;
    else if (task.createdBy === userId) canUpdate = true;
    else if (task.assigneeId === userId && status) canUpdate = true; // Assignee can update status

    if (!canUpdate) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }

    // Don't allow editing done tasks
    if (task.status === 'done') {
      return res.status(400).json({ message: 'Cannot edit completed tasks' });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assigneeId) task.assigneeId = Number(assigneeId);
    if (priority) task.priority = priority;
    if (status) task.status = status;
    task.updatedAt = new Date().toISOString();

    await saveDatabase();
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// Delete task for admin and project manager
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const task = findTaskById(Number(id));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = findProjectById(task.projectId);
    
    // Authorization check
    let canDelete = false;
    if (role === 'admin') canDelete = true;
    else if (project?.managerId === userId) canDelete = true;

    if (!canDelete) {
      return res.status(403).json({ message: 'You do not have permission to delete this task' });
    }

    // Don't allow deleting done tasks
    if (task.status === 'done') {
      return res.status(400).json({ message: 'Cannot delete completed tasks' });
    }

    const db = getDatabase();
    db.tasks = db.tasks.filter(t => t.id !== Number(id));
    await saveDatabase();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// Update task status for admin, project manager, or assignee
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, id: userId } = req.user;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const task = findTaskById(Number(id));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = findProjectById(task.projectId);
    
    // Authorization check
    let canUpdate = false;
    if (role === 'admin') canUpdate = true;
    else if (project?.managerId === userId) canUpdate = true;
    else if (task.assigneeId === userId) canUpdate = true;

    if (!canUpdate) {
      return res.status(403).json({ message: 'You do not have permission to update this task status' });
    }

    // If task is done, prevent status change unless admin
    if (task.status === 'done' && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change status of completed tasks' });
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();

    await saveDatabase();
    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Failed to update task status' });
  }
};