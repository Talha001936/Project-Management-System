
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

export default function ConfirmationDialog({
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  confirmColor = "error",
  loading = false,
  maxWidth = "xs"
}) {
  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{ 
        sx: { 
          backgroundColor: "#1a1a1a", 
          borderRadius: 2, 
          border: "1px solid #2a2a2a", 
          maxWidth: "400px" 
        } 
      }}
    >
      <DialogTitle sx={{ 
        color: "#e8e8e8", 
        fontWeight: 600, 
        borderBottom: "1px solid #2a2a2a", 
        pb: 2 
      }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <DialogContentText 
          sx={{ 
            color: "#888888",
            whiteSpace: "pre-line",
            lineHeight: 1.6
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid #2a2a2a", pt: 2, gap: 1 }}>
        <Button 
          onClick={onCancel} 
          disabled={loading}
          sx={{ 
            color: "#888888", 
            '&:hover': { backgroundColor: "rgba(136, 136, 136, 0.08)" } 
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={confirmColor}
          disabled={loading}
          sx={{
            backgroundColor: confirmColor === "error" ? "#d45454" : "#6c63ff",
            '&:hover': { 
              backgroundColor: confirmColor === "error" ? "#b84444" : "#5a52e8" 
            },
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Processing..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}