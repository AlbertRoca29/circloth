from datetime import datetime, timedelta
from typing import List, Dict, Optional
from db import FirestoreDB
import os
import random
import math


PASS_EXPIRY_SECONDS = int(os.getenv("PASS_EXPIRY_SECONDS", 60))  # default 60 seconds for testing

def get_available_items_for_user(user_id: str, location: dict = None, filter_by_size: bool = False) -> List[dict]:
    """
    Returns items available for matching for the user, considering pass expiry.
    If location is provided, items are ordered by proximity. Otherwise, order is randomized.
    If filter_by_size is True, only return items matching user's size_preferences.
    """
    db = FirestoreDB()
    user = db.get_user(user_id)
    if not user:
        return []

    actions = db.get_user_actions(user_id)
    now = datetime.utcnow()
    excluded_item_ids = set()
    passed_items_to_reconsider = set()
    latest_action_per_item: Dict[str, dict] = {}

    # Find the latest action for each item
    for action in actions:
        item_id = action["item_id"]
        prev = latest_action_per_item.get(item_id)
        if not prev or action["timestamp"] > prev["timestamp"]:
            latest_action_per_item[item_id] = action

    for item_id, action in latest_action_per_item.items():
        if action["action"] == "like":
            excluded_item_ids.add(item_id)
        elif action["action"] == "pass":
            # Check if pass is expired
            ts = action["timestamp"]
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts.replace("Z", ""))
            if (now - ts).total_seconds() < PASS_EXPIRY_SECONDS:
                excluded_item_ids.add(item_id)
            else:
                passed_items_to_reconsider.add(item_id)

    all_items = db.list_items()
    available_items = [
        item for item in all_items
        if item.get("ownerId") != user_id and item.get("id") not in excluded_item_ids
    ]

    # Filter by size preferences if requested
    if filter_by_size and user.get("size_preferences"):
        size_prefs = user["size_preferences"]
        def matches_size(item):
            item_size = item.get("size")
            item_category = item.get("category")
            if not item_size or not item_category:
                return False
            # size_prefs is a dict of lists: {category: [sizes]}
            allowed_sizes = size_prefs.get(item_category)
            if allowed_sizes and isinstance(allowed_sizes, list):
                return item_size in allowed_sizes
            return False
        available_items = [item for item in available_items if matches_size(item)]

    if location and "lat" in location and "lng" in location:
        def distance(item):
            loc = item.get("location")
            if loc and "lat" in loc and "lng" in loc:
                # Haversine formula for distance in km
                R = 6371
                dlat = math.radians(loc["lat"] - location["lat"])
                dlon = math.radians(loc["lng"] - location["lng"])
                a = math.sin(dlat/2)**2 + math.cos(math.radians(location["lat"])) * math.cos(math.radians(loc["lat"])) * math.sin(dlon/2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                return R * c
            return float('inf')
        available_items.sort(key=distance)
    else:
        random.shuffle(available_items)
    return available_items

def handle_user_action(user_id: str, item_id: str, action: str):
    """
    Save or overwrite the user's action for an item.
    """
    db = FirestoreDB()
    now = datetime.utcnow().isoformat() + "Z"
    # Remove previous actions for this item (if any)
    db.delete_user_action(user_id, item_id)
    db.save_user_action(user_id, item_id, action, now)
    # Optionally update user profile (e.g., passed_items) if needed

# New: get all matches for a user (reciprocal likes)
def get_all_matches(user_id: str):
    db = FirestoreDB()
    return db.get_all_matches_for_user(user_id)
