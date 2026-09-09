
import express from 'express';
import {
  
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamById,
  getallteams,
} from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  authorize,
  checkResourceAccess  
} from '../middleware/authorization.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createTeamSchema, updateTeamSchema } from '../validations/team.validation.js';
import { USER_ROLE } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getallteams);


router.get('/:id', 
  checkResourceAccess('team'),
  getTeamById
);


router.post('/', 
  authorize(USER_ROLE.ADMIN), 
  validate(createTeamSchema), 
  createTeam
);


router.put('/:id', 
  authorize(USER_ROLE.ADMIN),
  checkResourceAccess('team'),  
  validate(updateTeamSchema),
  updateTeam
);


router.delete('/:id', 
  authorize(USER_ROLE.ADMIN),
  checkResourceAccess('team'),  
  deleteTeam
);

export default router;
