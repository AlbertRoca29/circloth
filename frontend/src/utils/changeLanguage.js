import i18n from "../utils/i18n";
import BACKEND_URL from "../config";

const changeLanguage = async (lng, appUser) => {
  i18n.changeLanguage(lng);
  // Save language to backend if user is logged in
  if (appUser && appUser.uid) {
    try {
      await fetch(`${BACKEND_URL}/user/${appUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lng })
      });
    } catch (e) {
      // Handle error silently
    }
  }
};

export default changeLanguage;
