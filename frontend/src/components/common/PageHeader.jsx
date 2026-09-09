
import PropTypes from 'prop-types';
import { Box, Typography, Button } from "@mui/material";

export default function PageHeader({ 
  title, 
  actionLabel = null, 
  onAction = null, 
  showAction = true, 
  children = null 
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
      <Typography variant="h5" fontWeight={700}>{title}</Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {children}
        {showAction && actionLabel && onAction && (
          <Button 
            variant="contained" 
            onClick={onAction}
            sx={{
              backgroundColor: "#6c63ff",
              "&:hover": { backgroundColor: "#5a52e8" },
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  showAction: PropTypes.bool,
  children: PropTypes.node,
};
