
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

export default function BaseModal({ open, onClose, title, children, actions, maxWidth = "xs" }) {
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