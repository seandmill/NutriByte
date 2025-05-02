import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

// Simplified API URL - directly use /api for all environments
const API_BASE = "/api";

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      verifySession(email);
    } else {
      setLoading(false);
    }
  }, []);

  const verifySession = async (email) => {
    try {
      const response = await axios.get(`${API_BASE}/auth/verify`, {
        headers: { "X-User-Email": email },
      });
      setUser(response.data.user);
    } catch (error) {
      console.error("Session verification failed:", error);
      localStorage.removeItem("userEmail");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email });
      setUser(response.data.user);
      localStorage.setItem("userEmail", email);
      return response.data.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error(
        error.response?.data?.message || "Failed to log in. Please try again."
      );
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, userData);
      setUser(response.data.user);
      localStorage.setItem("userEmail", userData.email);
      return response.data.user;
    } catch (error) {
      console.error("Signup failed:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to create account. Please try again."
      );
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userEmail");
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
