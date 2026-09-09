
import express from 'express';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
  getProjectUsers,  
  getProjectTeams   
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  authorize,
  checkResourceAccess  
} from '../middleware/authorization.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validations/project.validation.js';
import { USER_ROLE } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);


router.get('/', getAllProjects);
router.get('/:id', checkResourceAccess('project'),getProjectById
);
router.get('/:id/users', checkResourceAccess('project'),getProjectUsers
);
router.get('/:id/teams', checkResourceAccess('project'),getProjectTeams
);
router.post('/', authorize(USER_ROLE.ADMIN, USER_ROLE.MANAGER), validate(createProjectSchema), createProject
);
router.put('/:id', authorize(USER_ROLE.ADMIN, USER_ROLE.MANAGER),checkResourceAccess('project'),  validate(updateProjectSchema),updateProject
);
router.delete('/:id', authorize(USER_ROLE.ADMIN, USER_ROLE.MANAGER),checkResourceAccess('project'),  deleteProject
);

export default router;
