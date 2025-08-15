
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials
import os
from fastapi.middleware.cors import CORSMiddleware
from db import FirestoreDB
import logging

app = FastAPI()

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
db = FirestoreDB()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class ItemModel(BaseModel):
    id: Optional[str] = None
    ownerId: str
    name: str
    category: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    brand: Optional[str] = None
    material: Optional[str] = None
    description: Optional[str] = None
    photoURLs: Optional[List[str]] = None

class UserModel(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    device_info: Optional[dict] = None
    passed_items: Optional[List[str]] = []

class MatchRequest(BaseModel):
    user_id: str

from datetime import datetime

class ActionRequest(BaseModel):
    user_id: str
    item_id: str
    action: str  # "like" or "pass"
    device_info: Optional[dict] = None

# --- Endpoints ---
@app.post("/match")
def match_items(req: MatchRequest):
    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Get all actions (like/pass) for this user
    actions = db.get_user_actions(req.user_id)
    excluded_item_ids = set(a["item_id"] for a in actions)
    # Exclude user's own items and already liked/passed items
    all_items = db.list_items()
    available_items = [item for item in all_items if item.get("ownerId") != req.user_id and item.get("id") not in excluded_item_ids]
    logging.warning(f"[MATCH DEBUG] user_id={req.user_id} excluded_item_ids={excluded_item_ids} available_items={len(available_items)}")
    if not available_items:
        logging.warning(f"[MATCH DEBUG] No items found for user_id={req.user_id}. All items: {all_items}")
        raise HTTPException(status_code=404, detail="No items found")
    return {"item": available_items[0]}

@app.post("/action")
def handle_action(req: ActionRequest):
    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Track pass/like in user doc (legacy for compatibility)
    if req.action == "pass":
        passed = user.get("passed_items", [])
        if req.item_id not in passed:
            passed.append(req.item_id)
            user["passed_items"] = passed
            db.update_user(req.user_id, user)
    # Store only item_id, action, timestamp in actions collection
    db.save_user_action(
        req.user_id,
        req.item_id,
        req.action,
        datetime.utcnow().isoformat() + "Z"
    )
    return {"message": "Action handled successfully"}

# --- Item CRUD ---
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
def create_item(item: ItemModel):
    item_dict = item.dict(exclude_unset=True)
    item_id = db.create_item(item_dict)
    return {"id": item_id}

@app.put("/item/{item_id}")
def update_item(item_id: str, item: ItemModel):
    db.update_item(item_id, item.dict(exclude_unset=True))
    return {"message": "Item updated"}

@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    db.delete_item(item_id)
    return {"message": "Item deleted"}

# --- User profile ---
# --- User profile ---

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

# --- User actions ---
@app.get("/user/{user_id}/actions")
def get_user_actions(user_id: str):
    actions = db.get_user_actions(user_id)
    return {"actions": actions}
