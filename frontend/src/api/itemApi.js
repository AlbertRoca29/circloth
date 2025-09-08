import BACKEND_URL from "../config";
import { setItemsToLocalStorage, getItemsFromLocalStorage } from "../utils/localStorage";

// Add item
export async function addItem(itemData) {
  const res = await fetch(`${BACKEND_URL}/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  });
  if (!res.ok) throw new Error('Failed to add item');
  return res.json();
}

// Delete item
export async function deleteItem(itemId) {
  const res = await fetch(`${BACKEND_URL}/item/${itemId}`, {
    method: 'DELETE',
  });
  return res;
}

// Fetch user items
export async function fetchUserItems(userId) {
  const res = await fetch(`${BACKEND_URL}/items/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user items');
  return res.json();
}

// Sync items with DB
export async function syncItemsWithDB(userId) {
  try {
    const response = await fetch(`${BACKEND_URL}/items/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch items from DB');
    const data = await response.json();
    const dbItems = data.items || [];
    setItemsToLocalStorage(userId, dbItems);
    return dbItems;
  } catch (error) {
    console.error('Error syncing items with DB:', error);
    return getItemsFromLocalStorage(userId);
  }
}
