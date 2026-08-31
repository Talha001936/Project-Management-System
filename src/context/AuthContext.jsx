// Note: This file is a context for authentication in the task application. 
// It provides an AuthContext that manages user authentication state, including login, 
// registration, and logout functionalities. The context also handles token validation 
// and user data persistence in local storage.
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("pms_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem("pms_token");
      if (!token) { 
        setLoading(false); 
        setAuthChecked(true); 
        return; 
      }
      try {
        const response = await api.get("/auth/me");
        if (response?.data?.user) {
          setUser(response.data.user);
          localStorage.setItem("pms_user", JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        localStorage.removeItem("pms_token");
        localStorage.removeItem("pms_user");
        setUser(null);
      }
      setLoading(false);
      setAuthChecked(true);
    };
    validate();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response); // Debug log
      
      if (response?.data?.token && response?.data?.user) {
        localStorage.setItem("pms_token", response.data.token);
        localStorage.setItem("pms_user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        return response.data;
      }
      throw new Error('Invalid login response structure');
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post("/auth/register", { name, email, password });
      return response.data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = () => {
    ["pms_token", "pms_user"].forEach(key => localStorage.removeItem(key));
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authChecked, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}