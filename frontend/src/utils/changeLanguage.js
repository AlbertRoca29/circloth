import i18n from "../utils/i18n";
import { updateUserLanguage } from "../api/userApi";

const changeLanguage = async (lng, appUser) => {
  i18n.changeLanguage(lng);
  // Save language to backend if user is logged in
  if (appUser && appUser.uid) {
    try {
      await updateUserLanguage(appUser.uid, lng);
    } catch (e) {
      // Handle error silently
    }
  }
};

export default changeLanguage;
