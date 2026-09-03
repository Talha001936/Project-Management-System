// Note: This file is a React component that renders the Users page, allowing administrators to manage 
// users, view user details, and perform actions like creating new users or changing user roles.
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useLoadData } from "../hooks/useLoadData.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import UserTable from "../components/users/UserTable.jsx";
import UserFormModal from "../components/users/UserFormModal.jsx";
import UserDetailsModal from "../components/users/UserDetailsModal.jsx";
import { hasValidSession, clearSession } from "../utils/permissions.js";
import api from "../api/axios.js";
import { useToast } from "../hooks/useToast.jsx";

const USERS_CACHE_KEY = 'users_data';

export default function Users() {
  const { showSuccess, showError, showWarning } = useToast();
  const [modalState, setModalState] = useState({ open: false });
  const [detailsState, setDetailsState] = useState({ open: false, user: null });

  const fetchData = async () => {
    if (!hasValidSession()) {
      clearSession();
      throw new Error('Session expired');
    }
    const res = await api.get("/users");
    return res.data;
  };

  const { data: users, loading, error, reload, clearCache } = useLoadData(
    fetchData,
    [],
    USERS_CACHE_KEY
  );

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  const handleDeleteUser = async (userId) => {
    if (!hasValidSession()) {
      clearSession();
      window.location.href = '/login';
      return;
    }

    try {
      const response = await api.delete(`/users/${userId}`);
      
      if (response.status === 200 || response.status === 204) {
        showSuccess('User deleted successfully');
        
        // Clear the cache and reload
        if (clearCache) {
          clearCache();
        }
        await reload();
      }
    } catch (err) {
      // Handle 404 - User already deleted
      if (err.response?.status === 404) {
        showWarning('User already deleted or does not exist');
        // Clear cache and reload to remove from UI
        if (clearCache) {
          clearCache();
        }
        await reload();
      } else if (err.response?.status === 401) {
        clearSession();
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        showError("You don't have permission to delete users");
      } else if (err.response?.status === 400) {
        showError(err.response?.data?.message || "Cannot delete this user");
      } else {
        showError(err.response?.data?.message || "Failed to delete user");
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!users) return null;

  return (
    <Box>
      <PageHeader
        title="User Management"
        actionLabel="New User"
        onAction={() => {
          if (!hasValidSession()) {
            clearSession();
            window.location.href = '/login';
            return;
          }
          setModalState({ open: true });
        }}
      />
      {users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <UserTable
          users={users}
          onViewDetails={(user) => {
            if (!hasValidSession()) {
              clearSession();
              window.location.href = '/login';
              return;
            }
            setDetailsState({ open: true, user });
          }}
          onRoleChange={() => {
            // Clear cache and reload
            if (clearCache) clearCache();
            reload();
          }}
          onStatusToggle={() => {
            // Clear cache and reload
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
          // Clear cache and reload
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