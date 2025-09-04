import BACKEND_URL from "../config";
import { getMatchesCacheFromLocalStorage, setMatchesCacheToLocalStorage, getActionsFromLocalStorage } from "../utils/general";

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
  const res = await fetch(`${BACKEND_URL}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, item_id: itemId, action })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send action");
  }
  // Update lastAction timestamp in matches cache
  const now = Date.now();
  const cache = getMatchesCacheFromLocalStorage(userId);
  if (cache) {
    cache.lastAction = now;
    setMatchesCacheToLocalStorage(userId, cache);
  }
  return res.json();
}


// Get all matches for user (reciprocal likes, efficient)
export async function fetchMatches(userId) {
  const res = await fetch(`${BACKEND_URL}/matches/${userId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch matches");
  }
  const data = await res.json();
  return data.matches || [];
}

// Fetch all items of profileUserId liked by visitorUserId (efficient, single call)
export async function fetchLikedItems(profileUserId, visitorUserId) {
  const res = await fetch(`${BACKEND_URL}/user/${visitorUserId}/liked_items/${profileUserId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch liked items");
  }
  const { liked_items } = await res.json();
  return liked_items || [];
}

// Cached matches logic
export async function getCachedOrFreshMatches(userId) {
  // Get cache from localStorage
  const cache = getMatchesCacheFromLocalStorage(userId);
  // Get latest user actions from localStorage
  const actionsObj = getActionsFromLocalStorage(userId);
  // Find latest action timestamp (like or pass)
  let latestActionTs = null;
  if (actionsObj && typeof actionsObj === 'object') {
    Object.values(actionsObj).forEach(action => {
      if (!latestActionTs || (action.timestamp && action.timestamp > latestActionTs)) {
        latestActionTs = action.timestamp;
      }
    });
  }
  const now = Date.now();
  // If cache exists, is less than 3 min old, and lastAction matches, use cache
  if (
    cache &&
    Array.isArray(cache.matches) &&
    cache.lastFetched &&
    cache.lastAction !== undefined &&
    latestActionTs === cache.lastAction &&
    now - cache.lastFetched < 3 * 60 * 1000
  ) {
    // Use cached matches, even if empty
    return cache.matches;
  }
  // Otherwise, fetch fresh matches
  const matches = await fetchMatches(userId);
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
