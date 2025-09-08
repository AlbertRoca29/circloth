
import i18n from "../utils/i18n";
import { patchUser } from "../api/userApi";

const changeLanguage = async (lng, appUser) => {
  i18n.changeLanguage(lng);
  // Save language to backend if user is logged in
  if (appUser && appUser.uid) {
    try {
      await patchUser(appUser.uid, { language: lng });
    } catch (e) {
      // Handle error silently
    }
  }
};

export default changeLanguage;
