//Note: This file defines the custom theme for the application using Material-UI's createTheme function.
//  It sets up a dark mode theme with specific colors for primary, secondary, background, text, and other 
// UI elements. It also includes style overrides for various Material-UI components to ensure a consistent
//  look and feel across the application.
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6c63ff",
      light: "#8b83ff",
      dark: "#4a42cc",
    },
    secondary: {
      main: "#4a9eff",
    },
    background: {
      default: "#0d0d0d",
      paper: "#1a1a1a",
    },
    text: {
      primary: "#e8e8e8",
      secondary: "#888888",
    },
    divider: "#2a2a2a",
    error: {
      main: "#d45454",
    },
    success: {
      main: "#4a9e4a",
    },
    warning: {
      main: "#f0a030",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0d0d0d",
          color: "#e8e8e8",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid #2a2a2a",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #2a2a2a",
          color: "#e8e8e8",
        },
        head: {
          color: "#888888",
          fontWeight: 600,
          backgroundColor: "#0d0d0d",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          background: "linear-gradient(135deg, #6c63ff 0%, #4a42cc 100%)",
          '&:hover': {
            background: "linear-gradient(135deg, #5a52e8 0%, #3a32b8 100%)",
          },
        },
        containedError: {
          background: "linear-gradient(135deg, #d45454 0%, #a84444 100%)",
          '&:hover': {
            background: "linear-gradient(135deg, #c04444 0%, #8a3a3a 100%)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: "#0d0d0d",
            borderRadius: "8px",
            '& fieldset': {
              borderColor: "#2a2a2a",
            },
            '&:hover fieldset': {
              borderColor: "#6c63ff",
            },
            '&.Mui-focused fieldset': {
              borderColor: "#6c63ff",
            },
          },
          '& .MuiInputLabel-root': {
            color: "#888888",
            '&.Mui-focused': {
              color: "#8b83ff",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "#0d0d0d",
          borderRadius: "8px",
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: "#2a2a2a",
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: "#6c63ff",
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: "#6c63ff",
          },
        },
        icon: {
          color: "#888888",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "#e8e8e8",
          '&:hover': {
            backgroundColor: "rgba(108, 99, 255, 0.08)",
          },
          '&.Mui-selected': {
            backgroundColor: "rgba(108, 99, 255, 0.12)",
            '&:hover': {
              backgroundColor: "rgba(108, 99, 255, 0.18)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#888888",
          '&.Mui-focused': {
            color: "#8b83ff",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});