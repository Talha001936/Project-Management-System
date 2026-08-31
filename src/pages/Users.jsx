// Note: This file is used to manage users . It fetches user data , displays it in a table, and
// provides modals for adding/editing users and viewing user details and all these happaned using reusabale components.
import { useState } from "react";
import { Box, Alert } from "@mui/material";
import { useLoadData } from "../hooks/useLoadData.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import UserTable from "../components/users/UserTable.jsx";
import UserFormModal from "../components/users/UserFormModal.jsx";
import UserDetailsModal from "../components/users/UserDetailsModal.jsx";
import api from "../api/axios.js";

export default function Users() {
  const [modalState, setModalState] = useState({ open: false, editing: null });
  const [detailsState, setDetailsState] = useState({ open: false, user: null });

  const { data: users, loading, error, reload } = useLoadData(() => api.get("/users").then(res => res.data), []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!users) return null;

  return (
    <Box>
      <PageHeader title="User Management" actionLabel="New User" onAction={() => setModalState({ open: true, editing: null })} />
      {users.length === 0 ? <EmptyState message="No users found." /> : (
        <UserTable
          users={users}
          onViewDetails={user => setDetailsState({ open: true, user })}
          onRoleChange={reload}
          onStatusToggle={reload}
        />
      )}
      <UserFormModal
        open={modalState.open || !!modalState.editing}
        onClose={() => setModalState({ open: false, editing: null })}
        onSuccess={reload}
        existingUsers={users}
        editingUser={modalState.editing}
      />
      <UserDetailsModal
        user={detailsState.user}
        open={detailsState.open}
        onClose={() => setDetailsState({ open: false, user: null })}
      />
    </Box>
  );
}