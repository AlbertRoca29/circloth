import { CATEGORY_EMOJI } from '../constants/categories';
import { SIZE_OPTIONS } from '../constants/categories';
import { fetchUserItems, syncItemsWithDB } from "../api/itemApi";
import { fetchUserActions, syncActionsWithDB } from "../api/matchApi";

export function getCategoryEmoji(category) {
  if (!category) return CATEGORY_EMOJI.other;
  let key = category;
  if (typeof category === 'object' && category.category) {
    key = category.category;
  }
  key = String(key).toLowerCase().replace(/\s|\//g, '_');
  return CATEGORY_EMOJI[key] || CATEGORY_EMOJI.other;
}

export function getSizeOptions(t) {
  const translate = (key) => t ? t(key) : key;
  const result = {};
  for (const [cat, opts] of Object.entries(SIZE_OPTIONS)) {
    result[cat] = opts.map(translate);
  }
  return result;
}


// Re-export localStorage utilities from localStorage.js for backward compatibility
export {
  getItemsFromLocalStorage,
  setItemsToLocalStorage,
  clearLocalStorage,
  getActionsFromLocalStorage,
  setActionsToLocalStorage,
  clearActionsFromLocalStorage,
  getMatchesCacheFromLocalStorage,
  setMatchesCacheToLocalStorage,
  clearMatchesCacheFromLocalStorage
} from './localStorage';
