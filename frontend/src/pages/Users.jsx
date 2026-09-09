// frontend/src/pages/Users.jsx
import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useLoadData } from '../hooks/useLoadData.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import UserTable from '../components/users/UserTable.jsx';
import UserFormModal from '../components/users/UserFormModal.jsx';
import UserDetailsModal from '../components/users/UserDetailsModal.jsx';
import api from '../api/axios.js';
import { useToast } from '../hooks/useToast.jsx';

export default function Users() {
  const { showSuccess, showError } = useToast();
  const [modalState, setModalState] = useState({ open: false });
  const [detailsState, setDetailsState] = useState({ open: false, user: null });

  const fetchData = async () => {
    try {
      const res = await api.get('/users');
      return res.data?.success ? res.data.data : res.data || [];
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error("You don't have permission to view users");
      }
      throw error;
    }
  };

  const {
    data: users,
    loading,
    error,
    reload,
    clearCache,
  } = useLoadData(fetchData, [], 'users_data');

  const handleDeleteUser = async userId => {
    try {
      await api.delete(`/users/${userId}`);
      showSuccess('User deleted');
      if (clearCache) clearCache();
      await reload();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    const isForbidden = error?.response?.status === 403 || error?.message?.includes('permission');
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: '#d45454' }}>
          {isForbidden
            ? 'You do not have permission to view users. This page is restricted to administrators only.'
            : typeof error === 'string'
              ? error
              : 'Failed to load users. Please try again.'}
        </Typography>
      </Box>
    );
  }

  if (!users) return null;

  return (
    <Box>
      <PageHeader
        title="Users"
        actionLabel="New User"
        onAction={() => setModalState({ open: true })}
      />
      {users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <UserTable
          users={users}
          onViewDetails={user => setDetailsState({ open: true, user })}
          onRoleChange={() => {
            if (clearCache) clearCache();
            reload();
          }}
          onStatusToggle={() => {
            if (clearCache) clearCache();
            reload();
          }}
          onDelete={handleDeleteUser}
        />
      )}

      <UserFormModal
        open={modalState.open}
        onClose={() => setModalState({ open: false })}
        onSuccess={() => {
          if (clearCache) clearCache();
          reload();
        }}
      />

      <UserDetailsModal
        user={detailsState.user}
        open={detailsState.open}
        onClose={() => setDetailsState({ open: false, user: null })}
      />
    </Box>
  );
}
