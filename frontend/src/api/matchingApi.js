import BACKEND_URL from "../config";

// Get next item to swipe/match
export async function fetchMatchItem(userId) {
  const res = await fetch(`${BACKEND_URL}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
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
