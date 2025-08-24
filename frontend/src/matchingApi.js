
import BACKEND_URL from "./config";

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
export async function sendMatchAction(userId, itemId, action, deviceInfo = {}) {
  const res = await fetch(`${BACKEND_URL}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, item_id: itemId, action, device_info: deviceInfo })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send action");
  }
  return res.json();
}

// Get all matches for user (no location)
export async function fetchMatches(userId) {
  const res = await fetch(`${BACKEND_URL}/matches/${userId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.matches || [];
}

// Get matches for user, filtered by location (hidden for future release)
// export async function fetchMatchesWithLocation(userId, coords) {
//   // If coords is null, do not send location
//   const body = coords
//     ? { user_id: userId, lat: coords.latitude, lng: coords.longitude }
//     : { user_id: userId };
//   const res = await fetch(`${BACKEND_URL}/matches/${userId}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body)
//   });
//   if (!res.ok) return [];
//   const data = await res.json();
//   return data.matches || [];
// }
