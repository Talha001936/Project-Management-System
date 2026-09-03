import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { theme } from "./theme.js";
import { AuthProvider, setGlobalClearCache } from "./context/AuthContext.jsx";
import App from "./App.jsx";
import "./index.css";
import { clearAllCache } from "./hooks/useLoadData.js";

clearAllCache();

setGlobalClearCache(clearAllCache);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster 
            position="bottom-right"
            gutter={8}
            containerStyle={{
              bottom: 40,
              right: 40,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'transparent',
                color: '#e8e8e8',
                boxShadow: 'none',
                padding: 0,
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
