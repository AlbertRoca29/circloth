import BACKEND_URL from "../config";

/**
 * Fetch user profile from the backend.
 * @param {string} userId - The user ID.
 * @returns {Promise<Response>} - The fetch response.
 */
export const fetchUserProfile = async (userId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/user/${userId}`);
    return response;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Create a new user in the backend.
 * @param {string} userId - The user ID.
 * @param {Object} userData - The user data to send.
 * @returns {Promise<Response>} - The fetch response.
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/user/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return response;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};
