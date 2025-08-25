// Location API hidden for future release
// import BACKEND_URL from "./config";

// export async function updateUserLocation(userId, coords) {
//   const res = await fetch(`${BACKEND_URL}/update_location`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ user_id: userId, lat: coords.latitude, lng: coords.longitude })
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.detail || "Failed to update location");
//   }
//   return res.json();
// }
