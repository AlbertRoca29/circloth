import { use } from "react";
import BACKEND_URL from "../config";
import { getMatchesCacheFromLocalStorage, setMatchesCacheToLocalStorage, clearAllLocalStorage } from "../utils/localStorage";


// Get last like timestamp for a user
export function getLastLikeFromLocalStorage(userId) {
  const ts = localStorage.getItem("last_like_" + userId);
  return ts ? parseInt(ts, 10) : null;
}

// Set last like timestamp for a user
export function setLastLikeToLocalStorage(userId, timestamp) {
  localStorage.setItem("last_like_" + userId, timestamp.toString());
}

// Get liked items for a user (array of {id})
export function getLikedItemsFromLocalStorage(userId) {
  const raw = localStorage.getItem("liked_items_" + userId);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

// Save liked items for a user (array of {id})
export function setLikedItemsToLocalStorage(userId, likedArr) {
  if (!Array.isArray(likedArr)) return;
  localStorage.setItem("liked_items_" + userId, JSON.stringify(likedArr));
}

export async function fetchUserLikes(userId) {
  try {
    const response = await fetch(`${BACKEND_URL}/user/${userId}/actions`);
    if (!response.ok) throw new Error('Failed to fetch user actions');
    const data = await response.json();
    // Only keep actions with action === 'like'
    const liked = Array.isArray(data.actions)
      ? data.actions.filter(a => a.action === 'like').map(a => ({ id: a.item_id }))
      : [];
    setLikedItemsToLocalStorage(userId, liked);
    return liked;
  } catch (error) {
    console.error('Error fetching user likes:', error);
    return getLikedItemsFromLocalStorage(userId);
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

// Record user like/pass on an item
export async function sendMatchAction(userId, itemId, action, itemData, otherUserId) {
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
  // Update liked items in localStorage
  let liked = getLikedItemsFromLocalStorage(userId);
  if (action === "like") {
    if (!liked.some(i => i.id === itemId)) {
      liked.push({ id: itemId });
      setLikedItemsToLocalStorage(userId, liked);
    }
  } else if (action === "pass") {
    liked = liked.filter(i => i.id !== itemId);
    setLikedItemsToLocalStorage(userId, liked);
  }
  // Optionally update matches cache as before
  let cache = getMatchesCacheFromLocalStorage(userId) || { matches: [], lastFetch: nowMs };
  let updated = false;
  if (action === "pass") {
    const before = cache.matches.length;
    cache.matches = cache.matches.filter(m => m.theirItem && m.theirItem.id !== itemId);
    if (cache.matches.length !== before) {
      updated = true;
    }
  } else if (action === "like" && itemData && otherUserId && otherUserId !== userId) {
    const existingMatch = cache.matches.find(m => m.otherUser && m.otherUser.id === otherUserId);
    if (existingMatch) {
      const newMatch = { ...existingMatch, theirItem: itemData };
      cache.matches.push(newMatch);
      updated = true;
    }
  }
  if (updated) {
    cache.lastFetch = nowMs;
    setMatchesCacheToLocalStorage(userId, cache);
    console.debug('[matches-cache] Updated matches cache after action:', cache);
  }
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
  if (now - lastFetch < 30 * 1000) {
    const lastLike = getLastLikeFromLocalStorage(userId);
    if (lastLike < lastFetch || lastLike === null || now - lastFetch < 5 * 60 * 1000) {
        const cache = getMatchesCacheFromLocalStorage(userId);
        if (cache && Array.isArray(cache.matches) && cache.matches.length > 0) {
          console.log('[matches-cache] Returning cached matches:', cache.matches);
          // Update liked items in localStorage from cache for both users
          cache.matches.forEach(m => {
            if (m.otherUser && m.otherUser.id) {
              fetchLikedItems(userId, m.otherUser.id, true).catch(() => {});
              fetchLikedItems(m.otherUser.id, userId, true).catch(() => {});
            }
          });
          return cache.matches;
        } else {
          return [];
        }
    }
  }
  const res = await fetch(`${BACKEND_URL}/matches/${userId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch matches");
  }
  const data = await res.json();
  localStorage.setItem(throttleKey, now.toString());
  // Update matches cache in localStorage
  if (Array.isArray(data.matches)) {
    const cacheObj = { matches: data.matches, lastFetch: now };
    console.log('[matches-cache] Fetched new matches from backend:', data.matches);
    setMatchesCacheToLocalStorage(userId, cacheObj);
    data.matches.forEach(m => {
      if (m.otherUser && m.otherUser.id) {
        fetchLikedItems(userId, m.otherUser.id, false).catch(() => {});
        fetchLikedItems(m.otherUser.id, userId, false).catch(() => {});
      }
    });
  } else {
    console.log('[matches-cache] No matches array in backend response:', data);
  }
  return data.matches || [];
}


// Fetch all items of profileUserId liked by visitorUserId (with cache)
export async function fetchLikedItems(profileUserId, visitorUserId, useLocalStorage = false) {
  if (useLocalStorage) {
    const liked = getLikedItemsFromLocalStorage(visitorUserId);
    if (liked && liked.length > 0) {
      return liked;
    }
  }
  // Always call /user/{visitorUserId}/actions endpoint to sync likes
  await fetchUserLikes(visitorUserId);
  // Now get liked items from localStorage
  const liked = getLikedItemsFromLocalStorage(visitorUserId);
  console.log(liked)
  return liked;
}


// Cached matches logic (no actions, only likes)
export async function getCachedOrFreshMatches(userId) {
  const cache = getMatchesCacheFromLocalStorage(userId);
  const now = Date.now();
  if (
    cache &&
    Array.isArray(cache.matches) &&
    cache.lastFetched &&
    now - cache.lastFetched < 3 * 60 * 1000
  ) {
    // Update liked items in localStorage from cache for both users
    fetchLikedItems(userId, userId, true).catch(() => {});
    cache.matches.forEach(m => {
      if (m.otherUser && m.otherUser.id) {
        fetchLikedItems(m.otherUser.id, userId, true).catch(() => {});
      }
    });
    return cache.matches;
  }
  // Try to fetch new matches, but only if 30s have passed
  const matches = await fetchMatches(userId);
  setMatchesCacheToLocalStorage(userId, {
    matches: Array.isArray(matches) ? matches : [],
    lastFetched: now
  });
  // Update liked items in localStorage after matches update for both users
  fetchLikedItems(userId, userId, false).catch(() => {});
  if (Array.isArray(matches)) {
    matches.forEach(m => {
      if (m.otherUser && m.otherUser.id) {
        fetchLikedItems(m.otherUser.id, userId, false).catch(() => {});
      }
    });
  }
  return Array.isArray(matches) ? matches : [];
}

// Fetch user size preferences
export async function fetchUserSizePreferences(userId) {
  const res = await fetch(`${BACKEND_URL}/user/${userId}/size_preferences`);
  if (!res.ok) throw new Error('Failed to fetch size preferences');
  return res.json();
}
