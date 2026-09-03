import express from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getAllUsers,
  getAllTeams,
  getAssignableUsers,
  getUsersList,   
  getTeamsList    
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorization.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validations/project.validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/users', getUsersList);      
router.get('/teams', getTeamsList);      


router.get('/all-users', authorize('admin', 'manager'), getAllUsers);
router.get('/all-teams', authorize('admin', 'manager'), getAllTeams);
router.get('/assignable-users', getAssignableUsers);

router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', authorize('admin', 'manager'), validate(createProjectSchema), createProject);
router.put('/:id', authorize('admin', 'manager'), validate(updateProjectSchema), updateProject);
router.delete('/:id', authorize('admin', 'manager'), deleteProject);

export default router;