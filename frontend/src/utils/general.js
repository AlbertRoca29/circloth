import { CATEGORY_EMOJI } from '../constants/categories';
import { SIZE_OPTIONS } from '../constants/categories';

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

export async function syncItemsWithDB(userId, backendUrl) {
  try {
    const response = await fetch(`${backendUrl}/items/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch items from DB');

    const data = await response.json();
    const dbItems = data.items || [];

    // Update localStorage with DB items
    setItemsToLocalStorage(userId, dbItems);

    return dbItems;
  } catch (error) {
    console.error('Error syncing items with DB:', error);
    return getItemsFromLocalStorage(userId); // Fallback to localStorage
  }
}

export async function syncActionsWithDB(userId, backendUrl) {
  try {
    const response = await fetch(`${backendUrl}/actions/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch actions from DB');

    const data = await response.json();
    const dbActions = data.actions || {};

    // Update localStorage with DB actions
    setActionsToLocalStorage(userId, dbActions);

    return dbActions;
  } catch (error) {
    console.error('Error syncing actions with DB:', error);
    return getActionsFromLocalStorage(userId); // Fallback to localStorage
  }
}
