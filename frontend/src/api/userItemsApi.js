import BACKEND_URL from "../config";
import { setItemsToLocalStorage, getItemsFromLocalStorage, setActionsToLocalStorage, getActionsFromLocalStorage } from "../utils/general";

export async function addItem(itemData) {
  const res = await fetch(`${BACKEND_URL}/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  });
  if (!res.ok) throw new Error('Failed to add item');
  return res.json();
}

export async function fetchUserActions(userId) {
  const res = await fetch(`${BACKEND_URL}/actions/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user actions');
  return res.json();
}

export async function fetchUserItems(userId) {
  const res = await fetch(`${BACKEND_URL}/items/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user items');
  return res.json();
}

export async function syncItemsWithDB(userId, backendUrl) {
  try {
    const response = await fetch(`${backendUrl}/items/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch items from DB');

    const data = await response.json();
    const dbItems = data.items || [];

    // Update localStorage with DB items
    setItemsToLocalStorage(userId, dbItems);

    return dbItems;
  } catch (error) {
    console.error('Error syncing items with DB:', error);
    return getItemsFromLocalStorage(userId); // Fallback to localStorage
  }
}

export async function syncActionsWithDB(userId, backendUrl) {
  try {
    const response = await fetch(`${backendUrl}/actions/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch actions from DB');

    const data = await response.json();
    const dbActions = data.actions || {};

    // Update localStorage with DB actions
    setActionsToLocalStorage(userId, dbActions);

    return dbActions;
  } catch (error) {
    console.error('Error syncing actions with DB:', error);
    return getActionsFromLocalStorage(userId); // Fallback to localStorage
  }
}
