

# --- Firestore Data Models for Circloth ---

# User document
USER_FIELDS = {
	"id": "str",  # Firestore doc id
	"name": "str",
	"email": "str",
	"device_info": "dict",  # device type, OS, app version, etc.
	"location": "dict or None",  # {"lat": float, "lng": float, "updated_at": str} or None
	"created_at": "str",
	"last_active": "str",
	"profile_picture_url": "str",
	"preferences": "dict",  # e.g. {"categories": [...], "sizes": [...], ...}
	"notification_settings": "dict",
	"language": "str",
}

# Item document
ITEM_FIELDS = {
	"id": "str",  # Firestore doc id
	"ownerId": "str",
	"category": "str",
	"size": "str",
	"itemStory": "str",
	"photoURLs": "list",
	"color": "str",
	"brand": "str",
	"material": "str",
	"additionalInfo": "str",
	"sizeDetails": "str",
	"created_at": "str",
	"updated_at": "str",
	# "status": "str",  # reserved for future use
}

# Action subcollection under user
ACTION_FIELDS = {
	"user_id": "str",      # Redundant but useful for queries
	"item_id": "str",
	"action": "str",       # "like" or "pass"
	"timestamp": "str",
}

# Chat document
CHAT_FIELDS = {
	"id": "str",  # conversation id
	"participants": "list",  # [user_id1, user_id2]
	"created_at": "str",
	"status": "str",         # e.g. "active", "archived"
}

# Message subcollection under chat
MESSAGE_FIELDS = {
	"sender": "str",
	"receiver": "str",
	"content": "str",
	"timestamp": "str",
}
