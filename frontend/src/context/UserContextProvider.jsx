import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Create context
export const UserContext = createContext();

// Custom hook for using the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserContextProvider");
  }
  return context;
};

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Configure axios to always send the token in the header
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    return () => {
      delete axios.defaults.headers.common["Authorization"];
    };
  }, []);

  // Fetch current user data on mount or when token changes
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/v1/users/me");
        setUser(response.data.data);
      } catch (error) {
        console.error("Error fetching user:", error);
        // If token is invalid, clear it
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Function to handle user login
  const loginUser = async (username, password) => {
    try {
      const response = await axios.post("/api/v1/users/login", {
        username,
        password,
      });

      const { accessToken, refreshToken, user: userData } = response.data.data;

      // Save token to localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Set axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      // Set user state
      setUser(userData);

      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  // Function to handle user registration
  const registerUser = async (userData) => {
    try {
      const response = await axios.post("/api/v1/users/register", userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Signup failed");
    }
  };

  // Function to handle user logout
  const logoutUser = async () => {
    try {
      if (user) {
        // Only attempt to logout on the server if we have a user
        await axios.post("/api/v1/users/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clean up local state regardless of server response
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      delete axios.defaults.headers.common["Authorization"];
      navigate("/login");
    }
  };

  // Refresh user data function (useful for profile updates)
  const refreshUserData = async () => {
    try {
      const response = await axios.get("/api/v1/users/me");
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      if (error.response?.status === 401) {
        logoutUser();
      }
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        loginUser,
        registerUser,
        logoutUser,
        refreshUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;
