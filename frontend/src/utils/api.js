import axios from "axios";

export const fetchAuthUser = async () => {
  const token = localStorage.getItem("token"); // Or wherever you're storing the token

  if (!token) {
    console.warn("No auth token found. Skipping fetchAuthUser.");
    return null; // Prevent API call if not logged in
  }

  try {
    const response = await axios.get(
      "http://localhost:3000/api/v1/users/getMe",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching auth user:", error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await axios.post("/api/v1/users/logout");
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};
