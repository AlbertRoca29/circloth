// Utility for calling the backend matching API
export async function fetchMatchItem(userId) {
  const res = await fetch("http://localhost:8000/match", {
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
  const res = await fetch("http://localhost:8000/action", {
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
