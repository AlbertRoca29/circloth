from fastapi import FastAPI, HTTPException
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
    #    "http://localhost:3000",
       "https://circloth-9014370275.europe-west1.run.app/",
        "https://circloth.com",
        "https:///www.circloth.com",
        "https://circloth--circl0th.europe-west4.hosted.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

# Canonical item model matching AddItem.js
class ItemModel(BaseModel):
    id: Optional[str] = None
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


class UserModel(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    device_info: Optional[dict] = None
    passed_items: Optional[List[str]] = []


class MatchRequest(BaseModel):
    user_id: str


class ActionRequest(BaseModel):
    user_id: str
    item_id: str
    action: str  # "like" or "pass"
    device_info: Optional[dict] = None


# --- Endpoints ---
@app.get("/")
def health():
    return {"ok": True}


# Use new matching logic
@app.post("/match")
def match_items(req: MatchRequest):
    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    available_items = get_available_items_for_user(req.user_id)
    logging.warning(
        f"[MATCH DEBUG] user_id={req.user_id} available_items={len(available_items)}"
    )
    if not available_items:
        return {"message": "🧺 No matches right now... but your next favorite outfit is just around the corner! ✨", "item": None}
    return {"item": available_items[0]}



# Use new action logic
@app.post("/action")
def handle_action(req: ActionRequest):
    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    handle_user_action(req.user_id, req.item_id, req.action, req.device_info)
    return {"message": "Action handled successfully"}


@app.get("/items/{user_id}")
def get_user_items(user_id: str):
    return {"items": db.list_user_items(user_id)}


@app.get("/item/{item_id}")
def get_item(item_id: str):
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.post("/item")

# Validate required fields and min 2 photos
@app.post("/item")
def create_item(item: ItemModel):
    if not item.category or not item.size or not item.itemStory:
        raise HTTPException(status_code=400, detail="Missing required fields: category, size, or itemStory")
    if not item.photoURLs or len(item.photoURLs) < 2:
        raise HTTPException(status_code=400, detail="At least 2 photos are required")
    item_dict = item.dict(exclude_unset=True)
    item_id = db.create_item(item_dict)
    return {"id": item_id}


@app.put("/item/{item_id}")

@app.put("/item/{item_id}")
def update_item(item_id: str, item: ItemModel):
    if not item.category or not item.size or not item.itemStory:
        raise HTTPException(status_code=400, detail="Missing required fields: category, size, or itemStory")
    if not item.photoURLs or len(item.photoURLs) < 2:
        raise HTTPException(status_code=400, detail="At least 2 photos are required")
    db.update_item(item_id, item.dict(exclude_unset=True))
    return {"message": "Item updated"}


@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    db.delete_item(item_id)
    return {"message": "Item deleted"}


@app.get("/user/{user_id}")
def get_user_profile(user_id: str):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/user/{user_id}")
def update_user_profile(user_id: str, user: UserModel):
    db.update_user(user_id, user.dict(exclude_unset=True))
    return {"message": "User updated"}


@app.get("/user/{user_id}/actions")
def get_user_actions(user_id: str):
    actions = db.get_user_actions(user_id)
    return {"actions": actions}


@app.get("/matches/{user_id}")
def get_matches(user_id: str):
    dbi = FirestoreDB()
    # 1. Get all actions by this user (likes given)
    my_actions = dbi.get_user_actions(user_id)
    my_likes = [a for a in my_actions if a.get("action") == "like"]
    # 2. Get all items owned by this user
    my_items = dbi.list_user_items(user_id)
    my_item_ids = set(i["id"] for i in my_items)
    # 3. For each of my items, get likes received
    received_likes = []
    for item in my_items:
        # Find all actions where someone else liked this item
        actions = []
        users_ref = dbi.db.collection("users")
        for user_doc in users_ref.stream():
            other_user_id = user_doc.id
            if other_user_id == user_id:
                continue
            other_actions = dbi.get_user_actions(other_user_id)
            for act in other_actions:
                if act.get("action") == "like" and act.get("item_id") == item["id"]:
                    act = dict(act)
                    act["user_id"] = other_user_id
                    received_likes.append(act)
    # 4. Find reciprocal likes
    matches = []
    for my_like in my_likes:
        their_item_id = my_like["item_id"]
        # Find the item to get ownerId
        their_item = dbi.get_item(their_item_id)
        if not their_item:
            continue
        their_user_id = their_item.get("ownerId")
        if not their_user_id or their_user_id == user_id:
            continue
        # Did this user like any of my items?
        reciprocal = next((l for l in received_likes if l["user_id"] == their_user_id), None)
        if reciprocal:
            # Get their user info
            other_user = dbi.get_user(their_user_id) or {"id": their_user_id}
            # Get my item they liked
            your_item = next((i for i in my_items if i["id"] == reciprocal["item_id"]), None)
            if their_item and your_item:
                matches.append({
                    "id": f"{user_id}_{their_user_id}_{their_item_id}_{your_item['id']}",
                    "otherUser": other_user,
                    "theirItem": their_item,
                    "yourItem": your_item
                })
    return {"matches": matches}





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
        raise HTTPException(status_code=400, detail="Missing sender, receiver, or content")
    db.add_chat_message(req.sender, req.receiver, req.content, datetime.utcnow().isoformat())
    return {"message": "Message sent"}

@app.post("/chat/list")
def list_messages(req: MessageListRequest):
    try:
        messages = db.get_chat_messages(req.user1, req.user2, req.limit)
        # If no messages, return empty list (not error)
        if not messages:
            return {"messages": []}
        return {"messages": messages}
    except Exception as e:
        import logging
        logging.exception(f"Error fetching chat messages for {req.user1} <-> {req.user2}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")



# --- Entrypoint ---
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
