
import PropTypes from 'prop-types';
import { Chip } from "@mui/material";

const createChipConfig = (config) => ({
  label: config.label,
  color: config.color,
  bgColor: config.bgColor,
  borderColor: config.borderColor
});

const STATUS_CONFIG = {
  todo: createChipConfig({
    label: "To Do",
    color: "#888888",
    bgColor: "rgba(136,136,136,0.12)",
    borderColor: "rgba(136,136,136,0.25)",
  }),
  "in-progress": createChipConfig({
    label: "In Progress",
    color: "#f0a030",
    bgColor: "rgba(240,160,48,0.12)",
    borderColor: "rgba(240,160,48,0.25)",
  }),
  review: createChipConfig({
    label: "Review",
    color: "#6c63ff",
    bgColor: "rgba(108,99,255,0.12)",
    borderColor: "rgba(108,99,255,0.25)",
  }),
  done: createChipConfig({
    label: "Done",
    color: "#4a9e4a",
    bgColor: "rgba(74,158,74,0.12)",
    borderColor: "rgba(74,158,74,0.25)",
  }),
  active: createChipConfig({
    label: "Active",
    color: "#4a9e4a",
    bgColor: "rgba(74,158,74,0.12)",
    borderColor: "rgba(74,158,74,0.25)",
  }),
  completed: createChipConfig({
    label: "Completed",
    color: "#6c63ff",
    bgColor: "rgba(108,99,255,0.12)",
    borderColor: "rgba(108,99,255,0.25)",
  }),
  archived: createChipConfig({
    label: "Archived",
    color: "#666666",
    bgColor: "rgba(102,102,102,0.12)",
    borderColor: "rgba(102,102,102,0.25)",
  }),
};

const PRIORITY_CONFIG = {
  low: createChipConfig({
    label: "Low",
    color: "#4a9e4a",
    bgColor: "rgba(74,158,74,0.10)",
    borderColor: "rgba(74,158,74,0.2)",
  }),
  medium: createChipConfig({
    label: "Medium",
    color: "#f0a030",
    bgColor: "rgba(240,160,48,0.10)",
    borderColor: "rgba(240,160,48,0.2)",
  }),
  high: createChipConfig({
    label: "High",
    color: "#d45454",
    bgColor: "rgba(212,84,84,0.10)",
    borderColor: "rgba(212,84,84,0.2)",
  }),
  critical: createChipConfig({
    label: "Critical",
    color: "#d45454",
    bgColor: "rgba(212,84,84,0.15)",
    borderColor: "rgba(212,84,84,0.3)",
  }),
};

const ChipBase = ({ config, size = "small" }) => (
  <Chip
    label={config.label}
    size={size}
    sx={{
      backgroundColor: config.bgColor,
      color: config.color,
      border: `1px solid ${config.borderColor}`,
      fontWeight: 500,
      fontSize: size === "small" ? "0.7rem" : "0.8rem",
      borderRadius: "6px",
      height: size === "small" ? "24px" : "32px",
      '& .MuiChip-label': { px: size === "small" ? 1 : 1.5 }
    }}
  />
);

ChipBase.propTypes = {
  config: PropTypes.shape({
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    bgColor: PropTypes.string.isRequired,
    borderColor: PropTypes.string.isRequired,
  }).isRequired,
  size: PropTypes.string,
};

export const StatusChip = ({ status, size = "small" }) => (
  <ChipBase config={STATUS_CONFIG[status] || STATUS_CONFIG.todo} size={size} />
);

StatusChip.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.string,
};

export const PriorityChip = ({ priority, size = "small" }) => (
  <ChipBase config={PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium} size={size} />
);

PriorityChip.propTypes = {
  priority: PropTypes.string.isRequired,
  size: PropTypes.string,
};
