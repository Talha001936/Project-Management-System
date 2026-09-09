import { useState } from 'react';
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  IconButton,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { StatusChip, PriorityChip } from '../common/StatusChip.jsx';
import ConfirmationDialog from '../common/ConfirmationDialog.jsx';
import api from '../../api/axios.js';
import { useToast } from '../../hooks/useToast.jsx';
import { getProjectName, getUserName, getStatusLabel } from '../../utils/helpers.js';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];

export default function TaskTable({
  tasks,
  projects = [],
  users = [],
  currentUser,
  onViewDetails,
  onStatusUpdate,
  onEdit,
  onDelete,
}) {
  const { showSuccess, showError } = useToast();
  const [statusChangeState, setStatusChangeState] = useState({
    open: false,
    taskId: null,
    newStatus: null,
    taskTitle: '',
    currentStatus: '',
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const canUpdateTaskStatus = task => {
    if (!task || !currentUser) return false;
    if (task.status === 'done') return false;
    return task.permissions?.canUpdateStatus === true;
  };

  const canEditDeleteTask = task => {
    if (!task || !currentUser) return { canEdit: false, canDelete: false };
    if (task.status === 'done') {
      return { canEdit: false, canDelete: false };
    }
    return {
      canEdit: task.permissions?.canEdit === true,
      canDelete: task.permissions?.canDelete === true,
    };
  };

  const updateStatus = async (id, newStatus) => {
    const task = tasks.find(t => Number(t.id) === Number(id));
    if (!task || task.status === newStatus) return;

    if (!canUpdateTaskStatus(task)) {
      showError("You don't have permission to update this task's status");
      return;
    }

    setStatusChangeState({
      open: true,
      taskId: id,
      newStatus: newStatus,
      taskTitle: task.title,
      currentStatus: task.status,
    });
  };

  const confirmStatusUpdate = async () => {
    setUpdatingStatus(true);
    try {
      const response = await api.patch(`/tasks/${statusChangeState.taskId}/status`, {
        status: statusChangeState.newStatus,
      });

      if (response.data?.success) {
        showSuccess(`Status updated to ${getStatusLabel(statusChangeState.newStatus)}`);
        if (onStatusUpdate) onStatusUpdate();
      } else {
        showError(response.data?.message || 'Failed to update status');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
      setStatusChangeState({
        open: false,
        taskId: null,
        newStatus: null,
        taskTitle: '',
        currentStatus: '',
      });
    }
  };

  if (tasks.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          border: '1px solid #2a2a2a',
          borderRadius: 3,
          backgroundColor: '#1a1a1a',
        }}
      >
        <Typography sx={{ color: '#888888' }}>
          {currentUser.role === 'employee'
            ? 'You have no tasks assigned to you.'
            : currentUser.role === 'manager'
              ? 'You have no accessible tasks.'
              : 'No tasks available.'}
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper
        sx={{
          border: '1px solid #2a2a2a',
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: '#1a1a1a',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#0d0d0d' }}>
              {['Title', 'Project', 'Assignee', 'Status', 'Priority', 'Actions'].map(label => (
                <TableCell
                  key={label}
                  sx={{ color: '#888888', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map(task => {
              const isDone = task.status === 'done';
              const canUpdateStatus = canUpdateTaskStatus(task);
              const { canEdit, canDelete } = canEditDeleteTask(task);

              const isAssignee = Number(task.assigneeId) === Number(currentUser.id);
              const isProjectManager = projects.some(
                p =>
                  Number(p.id) === Number(task.projectId) &&
                  Number(p.managerId) === Number(currentUser.id)
              );

              return (
                <TableRow
                  key={task.id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(108,99,255,0.04)' },
                    opacity: isDone ? 0.7 : 1,
                  }}
                >
                  <TableCell sx={{ color: isDone ? '#888888' : '#e8e8e8', fontWeight: 500 }}>
                    {task.title}
                  </TableCell>
                  <TableCell sx={{ color: '#888888' }}>
                    {getProjectName(task.projectId, projects)}
                  </TableCell>
                  <TableCell sx={{ color: '#888888' }}>
                    {getUserName(task.assigneeId, users)}
                    {isAssignee && (
                      <Chip
                        size="small"
                        label="You"
                        sx={{
                          ml: 1,
                          backgroundColor: 'rgba(108,99,255,0.12)',
                          color: '#6c63ff',
                          border: '1px solid rgba(108,99,255,0.25)',
                          fontSize: '0.6rem',
                          height: 20,
                        }}
                      />
                    )}
                    {isProjectManager && !isAssignee && currentUser.role === 'manager' && (
                      <Chip
                        size="small"
                        label="Manager"
                        sx={{
                          ml: 1,
                          backgroundColor: 'rgba(240,160,48,0.12)',
                          color: '#f0a030',
                          border: '1px solid rgba(240,160,48,0.25)',
                          fontSize: '0.6rem',
                          height: 20,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {isDone ? (
                      <StatusChip status={task.status} />
                    ) : canUpdateStatus ? (
                      <Select
                        size="small"
                        value={task.status}
                        onChange={e => updateStatus(task.id, e.target.value)}
                        disabled={updatingStatus}
                        sx={{
                          minWidth: 110,
                          backgroundColor: '#0d0d0d',
                          borderRadius: 1.5,
                          '& .MuiSelect-icon': { color: '#888888' },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a2a2a' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6c63ff' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6c63ff',
                          },
                          '&.Mui-disabled': { opacity: 0.7 },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              backgroundColor: '#1a1a1a',
                              border: '1px solid #2a2a2a',
                              borderRadius: '8px',
                            },
                          },
                        }}
                        renderValue={() => <StatusChip status={task.status} />}
                      >
                        {STATUSES.map(s => (
                          <MenuItem
                            key={s}
                            value={s}
                            sx={{
                              color: '#e8e8e8',
                              '&:hover': { backgroundColor: 'rgba(108,99,255,0.08)' },
                              '&.Mui-selected': { backgroundColor: 'rgba(108,99,255,0.12)' },
                            }}
                          >
                            <StatusChip status={s} />
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <StatusChip status={task.status} />
                    )}
                  </TableCell>
                  <TableCell>
                    <PriorityChip priority={task.priority || 'medium'} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(task)}
                        sx={{ color: '#888888' }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {!isDone && canEdit && (
                        <IconButton
                          size="small"
                          onClick={() => onEdit(task)}
                          sx={{ color: '#888888' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {!isDone && canDelete && (
                        <IconButton
                          size="small"
                          onClick={() => onDelete(task.id)}
                          sx={{ color: '#888888' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <ConfirmationDialog
        open={statusChangeState.open}
        title="Update Status?"
        message={`Change "${statusChangeState.taskTitle}" from "${getStatusLabel(statusChangeState.currentStatus)}" to "${getStatusLabel(statusChangeState.newStatus)}"?`}
        onConfirm={confirmStatusUpdate}
        onCancel={() =>
          setStatusChangeState({
            open: false,
            taskId: null,
            newStatus: null,
            taskTitle: '',
            currentStatus: '',
          })
        }
        confirmText="Update"
        confirmColor="primary"
        loading={updatingStatus}
      />
    </>
  );
}
