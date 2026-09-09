import { useEffect, useState, useCallback } from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { useForm } from '../../hooks/useForm.js';
import { useApi } from '../../hooks/useApi.js';
import BaseModal from '../common/BaseModal.jsx';
import ConfirmationDialog from '../common/ConfirmationDialog.jsx';
import api from '../../api/axios.js';
import { useToast } from '../../hooks/useToast.jsx';
import { tokenStorage } from '../../utils/tokenStorage.js';
import { hasValidSession } from '../../utils/permissions.js';

const INITIAL = { name: '', email: '', password: '', role: 'employee', active: true };

export default function UserFormModal({ open, onClose, onSuccess }) {
  const { showSuccess, showError, showInfo } = useToast();
  const { loading, error, setError, execute } = useApi();
  const { form, setForm, handleChange, resetForm } = useForm(INITIAL);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateSession = () => {
    if (!hasValidSession()) {
      tokenStorage.clear();
      showError('Your session has expired. Please login again.');
      setTimeout(() => {
        window.location.href = '/login?session=expired';
      }, 500);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (open) {
      setForm(INITIAL);
      setShowCloseConfirm(false);
      setShowCreateConfirm(false);
      setError('');
    }
  }, [open, setForm, setError]);

  const handleSubmit = useCallback(() => {
    if (!validateSession()) return;

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields');
      showError('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      showError('Please enter a valid email address');
      return;
    }

    // Password validation (minimum 8 characters)
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      showError('Password must be at least 8 characters');
      return;
    }

    setShowCreateConfirm(true);
  }, [form, setError, showError]);

  const performSubmit = useCallback(async () => {
    if (!validateSession()) return;

    setIsSubmitting(true);

    const data = {
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      password: form.password,
      role: form.role,
      active: form.active,
    };

    try {
      await execute(
        () => api.post('/users', data),
        () => {
          showSuccess('User created successfully');
          setShowCreateConfirm(false);
          setIsSubmitting(false);
          resetForm();
          onSuccess?.();
          handleCloseModal();
        },
        err => {
          setIsSubmitting(false);
          showError(err?.response?.data?.message || 'Failed to create user');
        }
      );
    } catch (err) {
      setIsSubmitting(false);
      showError(err?.response?.data?.message || 'Failed to create user');
    }
  }, [form, execute, showSuccess, showError, resetForm, onSuccess]);

  const handleCloseModal = useCallback(() => {
    resetForm();
    setShowCloseConfirm(false);
    setShowCreateConfirm(false);
    onClose();
  }, [resetForm, onClose]);

  const handleCloseAttempt = useCallback(() => {
    if (isSubmitting || !open) return;

    if (!validateSession()) {
      handleCloseModal();
      return;
    }

    const isModified = form.name || form.email || form.password || form.role !== 'employee';

    if (isModified && !loading) {
      setShowCloseConfirm(true);
    } else {
      handleCloseModal();
    }
  }, [form, loading, isSubmitting, open, handleCloseModal, validateSession]);

  const selectStyle = {
    backgroundColor: '#0d0d0d',
    borderRadius: 1.5,
    color: '#e8e8e8',
    '& .MuiSelect-icon': { color: '#888888' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a2a2a' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6c63ff' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6c63ff' },
  };

  const menuProps = {
    PaperProps: {
      sx: {
        backgroundColor: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
      },
    },
  };

  const menuItemStyle = {
    color: '#e8e8e8',
    '&:hover': { backgroundColor: 'rgba(108,99,255,0.08)' },
    '&.Mui-selected': { backgroundColor: 'rgba(108,99,255,0.12)' },
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleCloseAttempt}
        title="Create New User"
        actions={
          <button
            type="button"
            className="MuiButton-contained MuiButton-root"
            onClick={handleSubmit}
            disabled={loading || isSubmitting || !form.name || !form.email || !form.password}
            style={{
              padding: '6px 16px',
              background: '#6c63ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor:
                loading || isSubmitting || !form.name || !form.email || !form.password
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                loading || isSubmitting || !form.name || !form.email || !form.password ? 0.6 : 1,
            }}
          >
            {loading || isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        }
      >
        <TextField
          label="Full Name"
          value={form.name}
          onChange={handleChange('name')}
          fullWidth
          required
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#2a2a2a' },
              '&:hover fieldset': { borderColor: '#6c63ff' },
              '&.Mui-focused fieldset': { borderColor: '#6c63ff' },
            },
            '& .MuiInputLabel-root': { color: '#888888' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#6c63ff' },
            '& .MuiOutlinedInput-input': { color: '#e8e8e8' },
          }}
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          fullWidth
          required
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#2a2a2a' },
              '&:hover fieldset': { borderColor: '#6c63ff' },
              '&.Mui-focused fieldset': { borderColor: '#6c63ff' },
            },
            '& .MuiInputLabel-root': { color: '#888888' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#6c63ff' },
            '& .MuiOutlinedInput-input': { color: '#e8e8e8' },
          }}
        />
        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={handleChange('password')}
          fullWidth
          required
          helperText="Must be at least 8 characters"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#2a2a2a' },
              '&:hover fieldset': { borderColor: '#6c63ff' },
              '&.Mui-focused fieldset': { borderColor: '#6c63ff' },
            },
            '& .MuiInputLabel-root': { color: '#888888' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#6c63ff' },
            '& .MuiOutlinedInput-input': { color: '#e8e8e8' },
            '& .MuiFormHelperText-root': { color: '#666666' },
          }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: '#888888' }}>Role</InputLabel>
          <Select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            label="Role"
            sx={selectStyle}
            MenuProps={menuProps}
          >
            <MenuItem value="employee" sx={menuItemStyle}>
              Employee
            </MenuItem>
            <MenuItem value="manager" sx={menuItemStyle}>
              Manager
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={{ color: '#888888' }}>Status</InputLabel>
          <Select
            value={form.active ? 'active' : 'inactive'}
            onChange={e => setForm({ ...form, active: e.target.value === 'active' })}
            label="Status"
            sx={selectStyle}
            MenuProps={menuProps}
          >
            <MenuItem value="active" sx={menuItemStyle}>
              Active
            </MenuItem>
            <MenuItem value="inactive" sx={menuItemStyle}>
              Inactive
            </MenuItem>
          </Select>
        </FormControl>
      </BaseModal>

      <ConfirmationDialog
        open={showCloseConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to close this form?"
        onConfirm={handleCloseModal}
        onCancel={() => setShowCloseConfirm(false)}
        confirmText="Discard"
        cancelText="Keep Editing"
        confirmColor="error"
      />

      <ConfirmationDialog
        open={showCreateConfirm}
        title="Create New User?"
        message={`Create user?\n\nName: ${form.name}\nEmail: ${form.email}\nRole: ${form.role}\nStatus: ${form.active ? 'Active' : 'Inactive'}`}
        onConfirm={performSubmit}
        onCancel={() => setShowCreateConfirm(false)}
        confirmText="Create User"
        cancelText="Cancel"
        confirmColor="primary"
        loading={isSubmitting}
      />
    </>
  );
}
