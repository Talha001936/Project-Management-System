import express from 'express';
import {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getUsersForTeam
} from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorization.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createTeamSchema, updateTeamSchema } from '../validations/team.validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/users/for-team', authorize('admin', 'manager'), getUsersForTeam);


router.get('/', getAllTeams);
router.get('/:id', getTeamById);
router.post('/', authorize('admin'), validate(createTeamSchema), createTeam);
router.put('/:id', authorize('admin'), validate(updateTeamSchema), updateTeam);
router.delete('/:id', authorize('admin'), deleteTeam);

export default router;