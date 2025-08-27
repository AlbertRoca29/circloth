from fastapi import FastAPI, HTTPException,Body
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials
import google.auth
import os
from fastapi.middleware.cors import CORSMiddleware
from db import FirestoreDB
 # removed local messages import; use FirestoreDB for chat
from matching_service import get_available_items_for_user, handle_user_action
import logging
from datetime import datetime
from fastapi import Query

app = FastAPI()

# --- Firebase Init ---
if not firebase_admin._apps:
    cred = None

    # Case 1: local with serviceAccountKey.json
    local_path = "serviceAccountKey.json"
    if os.path.exists(local_path):
        cred = credentials.Certificate(local_path)

    # Case 2: Cloud Run with default credentials
    else:
        try:
            _, project_id = google.auth.default()
            cred = credentials.ApplicationDefault()
        except Exception as e:
            logging.error(f"Firebase init failed: {e}")
            raise

    firebase_admin.initialize_app(cred)

db = FirestoreDB()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "http://localhost:3000",
        "https://circloth-9014370275.europe-west1.run.app",
        "https://circloth.com",
        "https://www.circloth.com",
        "https://circloth--circl0th.europe-west4.hosted.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

# Canonical item model matching AddItem.js
class ItemModel(BaseModel):
    id: str = None
    ownerId: str
    category: str
    size: str
    itemStory: str
    photoURLs: List[str]
    # Optional fields
    color: Optional[str] = None
    brand: Optional[str] = None
    material: Optional[str] = None
    additionalInfo: Optional[str] = None
    sizeDetails: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UserModel(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    device_info: Optional[dict] = None
    passed_items: Optional[List[str]] = []
    location: Optional[dict] = None  # {"lat": float, "lng": float, "updated_at": str}
    created_at: Optional[str] = None
    last_active: Optional[str] = None
    preferences: Optional[dict] = None
    notification_settings: Optional[dict] = None
    language: Optional[str] = None


class MatchRequest(BaseModel):
    user_id: str



class ActionRequest(BaseModel):
    user_id: str
    item_id: str
    action: str  # "like" or "pass"
    device_info: Optional[dict] = None
    location: Optional[dict] = None  # Expecting {"lat": float, "lng": float} or similar



# --- Endpoints ---
# --- USER DELETE & EDIT ---
# Edit user name
@app.patch("/user/{user_id}")
def edit_user_name(user_id: str, name: str = Body(..., embed=True)):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    db.update_user(user_id, {"name": name})
    return {"message_key": "USER_NAME_UPDATED"}

# Delete user and all related data
@app.delete("/user/{user_id}")
def delete_user(user_id: str):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    # Delete all items of user
    items = db.list_user_items(user_id)
    for item in items:
        db.delete_item(item["id"])
    # Delete all actions by user
    db.delete_user_actions(user_id)
    # Delete all chat messages involving user
    db.delete_user_chats(user_id)
    # Delete all matches involving user (by removing likes)
    db.delete_user_matches(user_id)
    # Delete user itself
    db.delete_user(user_id)
    return {"message_key": "USER_DELETED"}
@app.get("/")
def health():
    return {"ok": True}


# Use new matching logic
@app.post("/match")
def match_items(req: MatchRequest):
    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    # Optionally update location if sent
    location = getattr(req, "location", None)
    if location:
        db.update_user(req.user_id, {"location": {**location, "updated_at": datetime.utcnow().isoformat() + "Z"}})
    available_items = get_available_items_for_user(req.user_id, location)
    logging.warning(
        f"[MATCH DEBUG] user_id={req.user_id} available_items={len(available_items)}"
    )
    if not available_items:
        return {"message_key": "NO_MATCHES", "item": None}
    return {"item": available_items[0]}



# Use new action logic
@app.post("/action")
def handle_action(req: ActionRequest):
    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")

    # Only update location if present
    # if hasattr(req, "location") and req.location:
    #     db.update_user(req.user_id, {"location": {**req.location, "updated_at": datetime.utcnow().isoformat() + "Z"}})
    print(req.user_id, req.item_id, req.action)
    handle_user_action(req.user_id, req.item_id, req.action)
    return {"message_key": "ACTION_HANDLED"}


@app.get("/items/{user_id}")
def get_user_items(user_id: str):
    return {"items": db.list_user_items(user_id)}


@app.get("/item/{item_id}")
def get_item(item_id: str):
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="ITEM_NOT_FOUND")
    return item


# Create item (no auth required)
@app.post("/item")
def create_item(item: ItemModel):
    # All fields are required except optional ones
    if not item.category or not item.size or not item.itemStory:
        raise HTTPException(status_code=400, detail="MISSING_REQUIRED_FIELDS")
    if not item.photoURLs or len(item.photoURLs) < 2:
        raise HTTPException(status_code=400, detail="NOT_ENOUGH_PHOTOS")
    item_dict = item.dict(exclude_unset=True)
    item_id = db.create_item(item_dict)
    return {"id": item_id}

# Edit item (same fields as creation)
@app.patch("/item/{item_id}")
def edit_item(item_id: str, item: ItemModel):
    # Only update provided fields
    db.update_item(item_id, item.dict(exclude_unset=True))
    return {"message_key": "ITEM_UPDATED"}

# Delete item and its relationships (not user)
@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    # Delete all actions related to this item (likes, passes)
    db.delete_item_actions(item_id)
    # Delete all matches related to this item (remove likes)
    db.delete_item_matches(item_id)
    # Delete the item itself
    db.delete_item(item_id)
    return {"message_key": "ITEM_DELETED"}
# --- MATCH DELETE ---
# Delete a match by erasing the like(s) on both or one end
@app.delete("/match/{user_id}/{other_user_id}/{item_id}/{your_item_id}")
def delete_match(user_id: str, other_user_id: str, item_id: str, your_item_id: str):
    # Remove like from user to other's item
    db.remove_like(user_id, item_id)
    # Remove like from other user to your item
    db.remove_like(other_user_id, your_item_id)
    return {"message_key": "MATCH_DELETED"}



@app.put("/item/{item_id}")
def update_item(item_id: str, item: ItemModel):
    if not item.category or not item.size or not item.itemStory:
        raise HTTPException(status_code=400, detail="MISSING_REQUIRED_FIELDS")
    if not item.photoURLs or len(item.photoURLs) < 2:
        raise HTTPException(status_code=400, detail="NOT_ENOUGH_PHOTOS")
    db.update_item(item_id, item.dict(exclude_unset=True))
    return {"message_key": "ITEM_UPDATED"}


@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    db.delete_item(item_id)
    return {"message_key": "ITEM_DELETED"}


@app.get("/user/{user_id}")
def get_user_profile(user_id: str):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    return user


@app.put("/user/{user_id}")
def update_user_profile(user_id: str, user: UserModel):
    db.update_user(user_id, user.dict(exclude_unset=True))
    return {"message_key": "USER_UPDATED"}


@app.get("/user/{user_id}/actions")
def get_user_actions(user_id: str):
    actions = db.get_user_actions(user_id)
    return {"actions": actions}


@app.get("/matches/{user_id}")
def get_matches(user_id: str):
    # Get current user's actions and items
    my_actions = db.get_user_actions(user_id)
    my_likes = {a["item_id"] for a in my_actions if a.get("action") == "like"}

    my_items = db.list_user_items(user_id)
    my_item_ids = {item["id"] for item in my_items}

    # Fetch all users except current
    users_ref = db.db.collection("users").stream()
    other_users = [u.id for u in users_ref if u.id != user_id]

    # Fetch all actions for other users once
    received_likes = {}  # key: (other_user_id, item_id) -> True
    for other_id in other_users:
        actions = db.get_user_actions(other_id)
        for act in actions:
            if act.get("action") == "like" and act.get("item_id") in my_item_ids:
                received_likes[(other_id, act["item_id"])] = True

    # Fetch all items once for lookup
    all_items = {i.id: i.to_dict() for i in db.db.collection("items").stream()}

    # Build matches
    grouped = {}
    for my_item in my_items:
        for liked_item_id in my_likes - my_item_ids:  # only items not owned by user
            their_item = all_items.get(liked_item_id)
            if not their_item:
                continue
            their_user_id = their_item.get("ownerId")
            if not their_user_id or their_user_id == user_id:
                continue

            # Check reciprocal like
            if received_likes.get((their_user_id, my_item["id"])):
                key = (their_user_id, liked_item_id)
                if key not in grouped:
                    other_user = db.get_user(their_user_id) or {"id": their_user_id}
                    grouped[key] = {
                        "id": f"{user_id}_{their_user_id}_{liked_item_id}",
                        "otherUser": other_user,
                        "theirItem": their_item,
                        "yourItems": []
                    }
                grouped[key]["yourItems"].append(my_item)

    return {"matches": list(grouped.values())}



# --- Chat Message Models ---
class MessageSendRequest(BaseModel):
    sender: str
    receiver: str
    content: str

class MessageListRequest(BaseModel):
    user1: str
    user2: str
    limit: Optional[int] = 50

# --- Chat Endpoints using FirestoreDB ---
@app.post("/chat/send")
def send_message(req: MessageSendRequest):
    if not req.sender or not req.receiver or not req.content:
        raise HTTPException(status_code=400, detail="MISSING_SENDER_RECEIVER_OR_CONTENT")
    db.add_chat_message(req.sender, req.receiver, req.content, datetime.utcnow().isoformat() + "Z")
    return {"message_key": "MESSAGE_SENT"}

@app.post("/chat/list")
def list_messages(req: MessageListRequest):
    try:
        # Update last_access and last_active for the user (req.user1)
        db.update_chat_last_access(req.user1, req.user2, req.user1)
        db.update_user(req.user1, {})
        messages = db.get_chat_messages(req.user1, req.user2, req.limit)
        # If no messages, return empty list (not error)
        if not messages:
            return {"messages": []}
        return {"messages": messages}
    except Exception as e:
        logging.exception(f"Error fetching chat messages for {req.user1} <-> {req.user2}")
        raise HTTPException(status_code=500, detail="FAILED_TO_FETCH_MESSAGES")



# --- List user chats endpoint ---
@app.get("/chat/list_chats/{user_id}")
def list_user_chats(user_id: str):
    chats = db.list_user_chats(user_id)
    return {"chats": chats}
# --- Update chat last access endpoint ---
class ChatAccessUpdateRequest(BaseModel):
    user1: str
    user2: str
    user_id: str

@app.post("/chat/update_access")
def update_chat_access(req: ChatAccessUpdateRequest):
    db.update_chat_last_access(req.user1, req.user2, req.user_id)
    return {"message_key": "LAST_ACCESS_UPDATED"}



# --- Entrypoint ---
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
