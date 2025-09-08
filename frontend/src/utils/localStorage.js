// Item storage
export function getItemsFromLocalStorage(userId) {
  const key = `items_${userId}`;
  return getFromLocalStorage(key) || [];
}

export function setItemsToLocalStorage(userId, items) {
  const key = `items_${userId}`;
  removeFromLocalStorage(key);
  setToLocalStorage(key, items);
}

export function clearLocalStorage(userId) {
  const key = `items_${userId}`;
  removeFromLocalStorage(key);
}

// Actions storage
export function getActionsFromLocalStorage(userId) {
  const key = `actions_${userId}`;
  return getFromLocalStorage(key) || {};
}

export function setActionsToLocalStorage(userId, actions) {
  const key = `actions_${userId}`;
  setToLocalStorage(key, actions);
}

export function clearActionsFromLocalStorage(userId) {
  const key = `actions_${userId}`;
  removeFromLocalStorage(key);
}

// Matches cache storage
export function getMatchesCacheFromLocalStorage(userId) {
  const key = `matches_cache_${userId}`;
  return getFromLocalStorage(key);
}

export function setMatchesCacheToLocalStorage(userId, cacheObj) {
  const key = `matches_cache_${userId}`;
  setToLocalStorage(key, cacheObj);
}

export function clearMatchesCacheFromLocalStorage(userId) {
  const key = `matches_cache_${userId}`;
  removeFromLocalStorage(key);
}
// Utility functions for managing localStorage

export function getFromLocalStorage(key) {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function setToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeFromLocalStorage(key) {
  localStorage.removeItem(key);
}
