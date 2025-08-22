import BACKEND_URL from "./config";

export async function sendMessage(sender, receiver, content) {
  const res = await fetch(`${BACKEND_URL}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender, receiver, content })
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }
  if (!res.ok) throw new Error(data.detail || 'Failed to send message');
  return data;
}

export async function fetchMessages(user1, user2, limit = 50) {
  const res = await fetch(`${BACKEND_URL}/chat/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user1, user2, limit })
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  const data = await res.json();
  return data.messages;
}
