import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { memo } from 'react';

function BaseModal({ 
  open, 
  onClose, 
  title, 
  children, 
  actions = null, 
  maxWidth = "xs" 
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#1a1a1a",
          borderRadius: 2,
          border: "1px solid #2a2a2a",
          maxWidth: "400px",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#e8e8e8",
          fontWeight: 600,
          borderBottom: "1px solid #2a2a2a",
          pb: 2,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          pt: 2,
          pr: 2.5,
        }}
      >
        {children}
      </DialogContent>
      <DialogActions
        sx={{ borderTop: "1px solid #2a2a2a", pt: 2, pb: 2, px: 3, gap: 1 }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: "#888888",
            "&:hover": { backgroundColor: "rgba(136, 136, 136, 0.08)" },
          }}
        >
          Cancel
        </Button>
        {actions}
      </DialogActions>
    </Dialog>
  );
}

BaseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  maxWidth: PropTypes.string,
};

export default memo(BaseModal);
