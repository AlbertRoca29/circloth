# =========================
# Imports
# =========================
import os
import logging
from datetime import datetime
from collections import defaultdict
import asyncio

from fastapi import FastAPI, HTTPException, Body, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials
import google.auth

from db import FirestoreDB
from matching_service import get_available_items_for_user, handle_user_action
from image_checks import check_image

# =========================
# Firebase Initialization
# =========================
if not firebase_admin._apps:
    cred = None
    local_path = "serviceAccountKey.json"
    if os.path.exists(local_path):
        cred = credentials.Certificate(local_path)
    else:
        try:
            _, project_id = google.auth.default()
            cred = credentials.ApplicationDefault()
        except Exception as e:
            logging.error(f"Firebase init failed: {e}")
            raise
    firebase_admin.initialize_app(cred)

db = FirestoreDB()

# =========================
# FastAPI App & CORS
# =========================
app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://www.circloth.com,https://circloth.com")
allowed_origins_list = allowed_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Models
# =========================
class ItemModel(BaseModel):
    id: str = None
    ownerId: str
    category: str
    size: str
    itemStory: str
    photoURLs: List[str]
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
    created_at: Optional[str] = None
    language: Optional[str] = None
    size_preferences: Optional[dict] = None
    location: Optional[dict] = None
    last_active: Optional[str] = None
    preferences: Optional[dict] = None
    notification_settings: Optional[dict] = None

class MatchRequest(BaseModel):
    user_id: str
    filter_by_size: bool = False

class ActionRequest(BaseModel):
    user_id: str
    item_id: str
    action: str  # "like" or "pass"
    device_info: Optional[dict] = None
    location: Optional[dict] = None

class MessageSendRequest(BaseModel):
    sender: str
    receiver: str
    content: str

class MessageListRequest(BaseModel):
    user1: str
    user2: str
    limit: Optional[int] = 50

class ChatAccessUpdateRequest(BaseModel):
    user1: str
    user2: str
    user_id: str

# =========================
# External Functions (if needed)
# =========================
def get_room_id(user1, user2):
    return "__".join(sorted([user1, user2]))

# =========================
# WebSocket Chat State
# =========================
chat_connections = defaultdict(set)

# =========================
# Variables
# =========================

MIN_PHOTOS = 1

# =========================
# Endpoints
# =========================

# --- Health Check ---
@app.get("/")
def health():
    return {"ok": True}

# --- User Endpoints ---
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

from fastapi import Request

@app.patch("/user/{user_id}")
async def edit_user_fields(user_id: str, request: Request):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    update_fields = await request.json()
    if not isinstance(update_fields, dict) or not update_fields:
        raise HTTPException(status_code=400, detail="NO_FIELDS_TO_UPDATE")
    db.update_user(user_id, update_fields)
    return {"message_key": "USER_UPDATED", "updated": list(update_fields.keys())}

@app.delete("/user/{user_id}")
def delete_user(user_id: str):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    items = db.list_user_items(user_id)
    for item in items:
        db.delete_item(item["id"])
    db.delete_user_actions(user_id)
    db.delete_user_chats(user_id)
    db.delete_user_matches(user_id)
    db.delete_user(user_id)
    return {"message_key": "USER_DELETED"}

@app.get("/user/{user_id}/actions")
def get_user_actions(user_id: str):
    actions = db.get_user_actions(user_id)
    return {"actions": actions}

@app.get("/user/{user_id}/size_preferences")
def get_size_preferences(user_id: str):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    return user.get("size_preferences", {})

@app.patch("/user/{user_id}/size_preferences")
def update_size_preferences(user_id: str, size_preferences: dict = Body(...)):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    db.update_user(user_id, {"size_preferences": size_preferences})
    return {"message_key": "SIZE_PREFERENCES_UPDATED"}

# --- Item Endpoints ---
@app.get("/items/{user_id}")
def get_user_items(user_id: str):
    return {"items": db.list_user_items(user_id)}

@app.get("/item/{item_id}")
def get_item(item_id: str):
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="ITEM_NOT_FOUND")
    return item

@app.post("/item")
def create_item(item: ItemModel):
    if not item.category or not item.size or not item.itemStory:
        raise HTTPException(status_code=400, detail="MISSING_REQUIRED_FIELDS")
    if not item.photoURLs or len(item.photoURLs) < MIN_PHOTOS:
        raise HTTPException(status_code=400, detail="NOT_ENOUGH_PHOTOS")
    for url in item.photoURLs:
        result = check_image(url)
        if result is not True:
            raise HTTPException(status_code=400, detail=str(result))
    item_dict = item.dict(exclude_unset=True)
    item_id = db.create_item(item_dict)
    return {"id": item_id}

@app.patch("/item/{item_id}")
def edit_item(item_id: str, item: ItemModel):
    db.update_item(item_id, item.dict(exclude_unset=True))
    return {"message_key": "ITEM_UPDATED"}

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
    db.delete_item_actions(item_id)
    db.delete_item_matches(item_id)
    db.delete_item(item_id)
    return {"message_key": "ITEM_DELETED"}

# --- Match Endpoints ---
@app.post("/match")
def match_items(req: MatchRequest):
    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    location = getattr(req, "location", None)
    if location:
        db.update_user(req.user_id, {"location": {**location, "updated_at": datetime.utcnow().isoformat() + "Z"}})
    available_items = get_available_items_for_user(req.user_id, location, filter_by_size=req.filter_by_size)
    logging.warning(
        f"[MATCH DEBUG] user_id={req.user_id} available_items={len(available_items)} filter_by_size={req.filter_by_size}"
    )
    if not available_items:
        return {"message_key": "NO_MATCHES", "item": None}
    return {"item": available_items[0]}

@app.post("/action")
def handle_action(req: ActionRequest):
    handle_user_action(req.user_id, req.item_id, req.action)
    return {"message_key": "ACTION_HANDLED"}

@app.delete("/match/{user_id}/{other_user_id}/{item_id}/{your_item_id}")
def delete_match(user_id: str, other_user_id: str, item_id: str, your_item_id: str):
    db.remove_like(user_id, item_id)
    db.remove_like(other_user_id, your_item_id)
    return {"message_key": "MATCH_DELETED"}

@app.get("/matches/{user_id}")
def get_matches(user_id: str):
    matches = db.get_all_matches_for_user(user_id)
    return {"matches": matches}

@app.get("/user/{visitor_id}/liked_items/{profile_id}")
def get_liked_items(profile_id: str, visitor_id: str):
    items = db.get_liked_items_of_profile_by_visitor(profile_id, visitor_id)
    return {"liked_items": items}

# --- Chat Endpoints ---
@app.websocket("/ws/chat/{user1}/{user2}")
async def chat_ws(websocket: WebSocket, user1: str, user2: str):
    room_id = get_room_id(user1, user2)
    await websocket.accept()
    chat_connections[room_id].add(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            sender = data.get("sender")
            receiver = data.get("receiver")
            content = data.get("content")
            if sender and receiver and content:
                db.add_chat_message(sender, receiver, content, datetime.utcnow().isoformat() + "Z")
                for conn in chat_connections[room_id]:
                    try:
                        await conn.send_json({"sender": sender, "receiver": receiver, "content": content})
                    except Exception:
                        pass
            else:
                await websocket.send_json({"error": "Invalid message format"})
    except WebSocketDisconnect:
        chat_connections[room_id].remove(websocket)
    except Exception:
        chat_connections[room_id].remove(websocket)
        await websocket.close()

@app.post("/chat/send")
def send_message(req: MessageSendRequest):
    if not req.sender or not req.receiver or not req.content:
        raise HTTPException(status_code=400, detail="MISSING_SENDER_RECEIVER_OR_CONTENT")
    db.add_chat_message(req.sender, req.receiver, req.content, datetime.utcnow().isoformat() + "Z")
    return {"message_key": "MESSAGE_SENT"}

@app.post("/chat/list")
def list_messages(req: MessageListRequest):
    try:
        db.update_chat_last_access(req.user1, req.user2, req.user1)
        db.update_user(req.user1, {})
        messages = db.get_chat_messages(req.user1, req.user2, req.limit)
        if not messages:
            return {"messages": []}
        return {"messages": messages}
    except Exception as e:
        logging.exception(f"Error fetching chat messages for {req.user1} <-> {req.user2}")
        raise HTTPException(status_code=500, detail="FAILED_TO_FETCH_MESSAGES")

@app.get("/chat/list_chats/{user_id}")
def list_user_chats(user_id: str):
    chats = db.list_user_chats(user_id)
    return {"chats": chats}

@app.post("/chat/update_access")
def update_chat_access(req: ChatAccessUpdateRequest):
    db.update_chat_last_access(req.user1, req.user2, req.user_id)
    return {"message_key": "LAST_ACCESS_UPDATED"}




# # --- Admin Endpoint: Delete passed_items field for a user ---
# @app.post("/admin/delete_passed_items/{user_id}")
# def admin_delete_passed_items(user_id: str):
#     db.delete_passed_items_field(user_id)
#     return {"message": f"'passed_items' field deleted for user {user_id}"}


# # --- Admin Endpoint: Delete passed_items field for all users ---
# @app.post("/admin/delete_passed_items_all")
# def admin_delete_passed_items_all():
#     db.delete_passed_items_field_all_users()
#     return {"message": "'passed_items' field deleted for all users"}


# # --- Admin Endpoint: Copy all user actions to global 'actions' collection ---
# @app.post("/admin/copy_all_user_actions_to_global")
# def admin_copy_all_user_actions_to_global():
#     db.copy_all_user_actions_to_global()
#     return {"message": "All user actions copied to global 'actions' collection."}

# =========================
# Entrypoint
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
