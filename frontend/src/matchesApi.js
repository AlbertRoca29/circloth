import BACKEND_URL from "./config";

export async function fetchMatchesWithLocation(userId, coords) {
  // If coords is null, do not send location
  const body = coords
    ? { user_id: userId, lat: coords.latitude, lng: coords.longitude }
    : { user_id: userId };
  const res = await fetch(`${BACKEND_URL}/matches/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.matches || [];
}
