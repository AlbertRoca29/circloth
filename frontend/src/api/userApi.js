import BACKEND_URL from "../config";
// Function to update the user's language preference
export const updateUserLanguage = async (userId, language) => {
  const response = await fetch(`${BACKEND_URL}/user/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language })
  });

  if (!response.ok) {
    throw new Error('Failed to update user language');
  }

  return response.json();
};
