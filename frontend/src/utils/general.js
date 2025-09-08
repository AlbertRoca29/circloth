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

// Utility functions for managing localStorage
export function getItemsFromLocalStorage(userId) {
  const key = `items_${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function setItemsToLocalStorage(userId, items) {
  const key = `items_${userId}`;
  localStorage.removeItem(key);
  localStorage.setItem(key, JSON.stringify(items));
}

export function clearLocalStorage(userId) {
  const key = `items_${userId}`;
  localStorage.removeItem(key);
}

// Utility functions for managing actions in localStorage
export function getActionsFromLocalStorage(userId) {
  const key = `actions_${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
}

export function setActionsToLocalStorage(userId, actions) {
  const key = `actions_${userId}`;
  localStorage.setItem(key, JSON.stringify(actions));
}

export function clearActionsFromLocalStorage(userId) {
  const key = `actions_${userId}`;
  localStorage.removeItem(key);
}

// Utility functions for managing matches cache in localStorage
export function getMatchesCacheFromLocalStorage(userId) {
  const key = `matches_cache_${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export function setMatchesCacheToLocalStorage(userId, cacheObj) {
  const key = `matches_cache_${userId}`;
  localStorage.setItem(key, JSON.stringify(cacheObj));
}

export function clearMatchesCacheFromLocalStorage(userId) {
  const key = `matches_cache_${userId}`;
  localStorage.removeItem(key);
}
