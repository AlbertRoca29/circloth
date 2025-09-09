import BACKEND_URL from "../config";
import { getMatchesCacheFromLocalStorage, setMatchesCacheToLocalStorage } from "../utils/localStorage";

// --- NEW Local Storage Action Utilities ---
const LAST_LIKE_KEY_PREFIX = "last_like_";

// Get last like timestamp for a user
export function getLastLikeFromLocalStorage(userId) {
  const ts = localStorage.getItem(LAST_LIKE_KEY_PREFIX + userId);
  return ts ? parseInt(ts, 10) : null;
}

// Set last like timestamp for a user
export function setLastLikeToLocalStorage(userId, timestamp) {
  localStorage.setItem(LAST_LIKE_KEY_PREFIX + userId, timestamp.toString());
}
const ACTIONS_KEY_PREFIX = "user_actions_";

// Get all actions for a user (array of {action, item_id, timestamp, user_id})
export function getActionsFromLocalStorage(userId) {
  const raw = localStorage.getItem(ACTIONS_KEY_PREFIX + userId);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

// Save all actions for a user (array of {action, item_id, timestamp, user_id})
export function setActionsToLocalStorage(userId, actionsArr) {
  if (!Array.isArray(actionsArr)) return;
  localStorage.setItem(ACTIONS_KEY_PREFIX + userId, JSON.stringify(actionsArr));
}

// Add or update a single action (by item_id) for a user
export function upsertActionToLocalStorage(userId, actionObj) {
  if (!actionObj || !actionObj.item_id) return;
  let actions = getActionsFromLocalStorage(userId);
  const idx = actions.findIndex(a => a.item_id === actionObj.item_id);
  if (idx !== -1) {
    actions[idx] = actionObj;
  } else {
    actions.push(actionObj);
  }
  setActionsToLocalStorage(userId, actions);
}

// Remove all actions for a user
export function clearActionsFromLocalStorage(userId) {
  localStorage.removeItem(ACTIONS_KEY_PREFIX + userId);
}

// Get liked items for a user (array of item_id)
export function getLikedItemsFromLocalStorage(userId) {
  const actions = getActionsFromLocalStorage(userId);
  return actions.filter(a => a.action === "like").map(a => ({ id: a.item_id }));
}


// Fetch user actions (with cache/localStorage logic inside)
export async function fetchUserActions(userId, useLocalStorage = false) {
  if (useLocalStorage) {
    const cachedActions = getActionsFromLocalStorage(userId);
    if (cachedActions && cachedActions.length > 0) {
      return cachedActions;
    }
  }
  const res = await fetch(`${BACKEND_URL}/actions/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user actions');
  const data = await res.json();
  if (useLocalStorage && Array.isArray(data.actions)) {
    setActionsToLocalStorage(userId, data.actions);
  }
  return data.actions;
}

// Sync actions with DB
export async function syncActionsWithDB(userId) {
  try {
    const response = await fetch(`${BACKEND_URL}/actions/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch actions from DB');
    const data = await response.json();
    const dbActions = Array.isArray(data.actions) ? data.actions : [];
    setActionsToLocalStorage(userId, dbActions);
    return dbActions;
  } catch (error) {
    console.error('Error syncing actions with DB:', error);
    return getActionsFromLocalStorage(userId);
  }
}
// Get next item to swipe/match
export async function fetchMatchItem(userId, filterBySize = false) {
  const res = await fetch(`${BACKEND_URL}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, filter_by_size: filterBySize })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch match item");
  }
  const data = await res.json();
  return data.item;
}

// Record user action on an item
export async function sendMatchAction(userId, itemId, action) {
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();
  const body = { user_id: userId, item_id: itemId, action };
  if (action === "like") {
    body.last_like = nowMs;
  }
  const res = await fetch(`${BACKEND_URL}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send action");
  }
  // Save action to localStorage
  const actionObj = { action, item_id: itemId, timestamp: nowIso, user_id: userId };
  upsertActionToLocalStorage(userId, actionObj);
  // Update last_like in localStorage if like
  if (action === "like") {
    setLastLikeToLocalStorage(userId, nowMs);
  }
  // Update lastAction timestamp in matches cache (for cache logic)
  const cache = getMatchesCacheFromLocalStorage(userId);
  if (cache) {
    cache.lastAction = nowIso;
    setMatchesCacheToLocalStorage(userId, cache);
  }
  return res.json();
}

export async function fetchMatches(userId) {
  const throttleKey = `matches_last_fetch_${userId}`;
  const lastFetch = parseInt(localStorage.getItem(throttleKey), 10) || 0;
  const now = Date.now();

  // Throttle if less than 30s since last fetch
  if (now - lastFetch < 30 * 1000 ) {
    const lastLike = getLastLikeFromLocalStorage(userId);
    if (lastLike && now - lastLike > 30 * 1000) {
        const cache = getMatchesCacheFromLocalStorage(userId);
        return cache && Array.isArray(cache.matches) ? cache.matches : [];
    }
  }

  const res = await fetch(`${BACKEND_URL}/matches/${userId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch matches");
  }
  const data = await res.json();
  localStorage.setItem(throttleKey, now.toString());
  return data.matches || [];
}

// Fetch all items of profileUserId liked by visitorUserId (efficient, single call, with cache)
export async function fetchLikedItems(profileUserId, visitorUserId, useLocalStorage = false) {
  if (useLocalStorage) {
    const liked = getLikedItemsFromLocalStorage(visitorUserId);
    if (liked && liked.length > 0) {
      return liked;
    }
  }
  const res = await fetch(`${BACKEND_URL}/user/${visitorUserId}/liked_items/${profileUserId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch liked items");
  }
  const { liked_items } = await res.json();
  if (useLocalStorage && Array.isArray(liked_items)) {
    // Merge liked items into localStorage actions (set action: 'like')
    let actions = getActionsFromLocalStorage(visitorUserId);
    const now = new Date().toISOString();
    liked_items.forEach(item => {
      const idx = actions.findIndex(a => a.item_id === item.id);
      if (idx !== -1) {
        actions[idx].action = "like";
        actions[idx].timestamp = now;
      } else {
        actions.push({ action: "like", item_id: item.id, timestamp: now, user_id: visitorUserId });
      }
    });
    setActionsToLocalStorage(visitorUserId, actions);
  }
  return liked_items || [];
}

// Cached matches logic
export async function getCachedOrFreshMatches(userId) {
  const cache = getMatchesCacheFromLocalStorage(userId);
  const actionsArr = getActionsFromLocalStorage(userId);
  // Find latest action timestamp
  let latestActionTs = null;
  actionsArr.forEach(action => {
    if (!latestActionTs || (action.timestamp && action.timestamp > latestActionTs)) {
      latestActionTs = action.timestamp;
    }
  });
  const now = Date.now();
  if (
    cache &&
    Array.isArray(cache.matches) &&
    cache.lastFetched &&
    cache.lastAction !== undefined &&
    latestActionTs === cache.lastAction &&
    now - cache.lastFetched < 3 * 60 * 1000
  ) {
    return cache.matches;
  }
  // Try to fetch new matches, but only if 30s have passed
  const matches = await fetchMatches(userId);
  if (matches === null) {
    // Throttled, return cache if available
    return cache && Array.isArray(cache.matches) ? cache.matches : [];
  }
  setMatchesCacheToLocalStorage(userId, {
    matches: Array.isArray(matches) ? matches : [],
    lastFetched: now,
    lastAction: latestActionTs !== undefined ? latestActionTs : null
  });
  return Array.isArray(matches) ? matches : [];
}

// Fetch user size preferences
export async function fetchUserSizePreferences(userId) {
  const res = await fetch(`${BACKEND_URL}/user/${userId}/size_preferences`);
  if (!res.ok) throw new Error('Failed to fetch size preferences');
  return res.json();
}
