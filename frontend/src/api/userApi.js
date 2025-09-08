import BACKEND_URL from "../config";


export const fetchUserProfile = async (userId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/user/${userId}`);
    return response;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

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

// Function to update any user fields (patch)
export const patchUser = async (userId, fields) => {
  const response = await fetch(`${BACKEND_URL}/user/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields)
  });
  if (!response.ok) {
    throw new Error('Failed to update user fields');
  }
  return response.json();
};

// Fetch user size preferences
export async function fetchUserSizePreferences(userId) {
  const res = await fetch(`${BACKEND_URL}/user/${userId}/size_preferences`);
  if (!res.ok) throw new Error('Failed to fetch size preferences');
  return res.json();
}
