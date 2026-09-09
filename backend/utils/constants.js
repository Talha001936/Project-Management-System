
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const USER_ROLE = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  DONE: 'done'
};

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const PORT = process.env.PORT ;
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not defined in .env file');
}
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY ;
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY ;
export const NODE_ENV = process.env.NODE_ENV ;