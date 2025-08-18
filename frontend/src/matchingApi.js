// Utility for calling the backend matching API
import BACKEND_URL from "./config";
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
