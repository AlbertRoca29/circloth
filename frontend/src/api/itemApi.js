import BACKEND_URL from "../config";
import { setItemsToLocalStorage, getItemsFromLocalStorage } from "../utils/localStorage";

// Add item
// Optionally pass contextId for matching
export async function addItem(itemData, userId, contextId = null) {
  const res = await fetch(`${BACKEND_URL}/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  });
  if (!res.ok) throw new Error('Failed to add item');
  const newItem = await res.json();
  // Update local storage
  if (userId) {
    const items = getItemsFromLocalStorage(userId, contextId) || [];
    setItemsToLocalStorage(userId, [...items, newItem], contextId);
  }
  return newItem;
}

// Delete item
// Optionally pass contextId for matching
export async function deleteItem(itemId, userId, contextId = null) {
  const res = await fetch(`${BACKEND_URL}/item/${itemId}`, {
    method: 'DELETE',
  });
  if (userId) {
    const items = getItemsFromLocalStorage(userId, contextId) || [];
    const updatedItems = items.filter(i => i.id !== itemId);
    setItemsToLocalStorage(userId, updatedItems, contextId);
  }
  return res;
}

// Fetch user items (with cache/localStorage logic inside)
// Optionally pass contextId for matching
export async function fetchUserItems(userId, useLocalStorage = true, contextId = null) {
  if (false) {
    const cachedItems = getItemsFromLocalStorage(userId, contextId);
    if (cachedItems && cachedItems.length > 0) {
      return { items: cachedItems };
    }
  }
  const res = await fetch(`${BACKEND_URL}/items/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user items');
  const data = await res.json();
  console.log('Fetched items from backend for user', userId, ':', data.items);
  setItemsToLocalStorage(userId, data.items, contextId);
  return data;
}

// Sync items with DB
// Optionally pass contextId for matching
export async function syncItemsWithDB(userId, contextId = null) {
  try {
    const response = await fetch(`${BACKEND_URL}/items/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch items from DB');
    const data = await response.json();
    const dbItems = data.items || [];
  setItemsToLocalStorage(userId, dbItems, contextId);
    return dbItems;
  } catch (error) {
    console.error('Error syncing items with DB:', error);
  return getItemsFromLocalStorage(userId, contextId);
  }
}

// Lock/unlock item for a trade
export async function lockItem(itemId, lockedFor) {
  const res = await fetch(`${BACKEND_URL}/item/${itemId}/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId, user_id: lockedFor })
  });
  if (!res.ok) throw new Error('Failed to update lock');
  return await res.json();
}
