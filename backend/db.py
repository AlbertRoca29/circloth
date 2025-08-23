# Firestore database logic for Circloth backend
from firebase_admin import firestore
from typing import List, Optional


from datetime import datetime

class FirestoreDB:
    def delete_item_matches(self, item_id: str):
        """Delete all user actions of type 'like' for a given item_id from all users (removes matches)."""
        users_ref = self.db.collection("users")
        for user_doc in users_ref.stream():
            user_id = user_doc.id
            actions_ref = users_ref.document(user_id).collection("actions")
            for doc in actions_ref.where("item_id", "==", item_id).where("action", "==", "like").stream():
                doc.reference.delete()
    def delete_item_actions(self, item_id: str):
        """Delete all user actions (likes, passes) for a given item_id from all users."""
        users_ref = self.db.collection("users")
        for user_doc in users_ref.stream():
            user_id = user_doc.id
            actions_ref = users_ref.document(user_id).collection("actions")
            for doc in actions_ref.where("item_id", "==", item_id).stream():
                doc.reference.delete()
    def _doc_with_id(self, doc):
        data = doc.to_dict() or {}
        data['id'] = doc.id
        return data
    def __init__(self):
        self.db = firestore.client()

    # --- User logic ---
    def get_user(self, user_id: str) -> Optional[dict]:
        doc = self.db.collection("users").document(user_id).get()
        return doc.to_dict() if doc.exists else None

    def update_user(self, user_id: str, data: dict):
        # Always update last_active
        data["last_active"] = datetime.utcnow().isoformat() + "Z"
        self.db.collection("users").document(user_id).set(data, merge=True)

    def create_user(self, user_id: str, data: dict):
        now = datetime.utcnow().isoformat() + "Z"
        data["created_at"] = now
        data["last_active"] = now
        self.db.collection("users").document(user_id).set(data)

    # --- Item logic ---
    def get_item(self, item_id: str) -> Optional[dict]:
        doc = self.db.collection("items").document(item_id).get()
        return doc.to_dict() if doc.exists else None

    def list_items(self, exclude_owner: Optional[str] = None, exclude_ids: Optional[List[str]] = None) -> List[dict]:
        ref = self.db.collection("items")
        query = ref
        if exclude_ids and len(exclude_ids) > 0:
            query = query.where("id", "not-in", exclude_ids)
        docs = [self._doc_with_id(doc) for doc in query.stream()]
        if exclude_owner:
            docs = [doc for doc in docs if doc.get("ownerId") != exclude_owner]
        return docs

    def create_item(self, data: dict) -> str:
        now = datetime.utcnow().isoformat() + "Z"
        data["created_at"] = now
        data["updated_at"] = now
        doc_ref = self.db.collection("items").add(data)[1]
        return doc_ref.id

    def update_item(self, item_id: str, data: dict):
        data["updated_at"] = datetime.utcnow().isoformat() + "Z"
        self.db.collection("items").document(item_id).set(data, merge=True)

    def delete_item(self, item_id: str):
        self.db.collection("items").document(item_id).delete()

    def list_user_items(self, user_id: str) -> List[dict]:
        ref = self.db.collection("items").where("ownerId", "==", user_id)
        return [self._doc_with_id(doc) for doc in ref.stream()]

    # --- User Actions ---
    def delete_user_action(self, user_id: str, item_id: str):
        actions_ref = self.db.collection("users").document(user_id).collection("actions")
        for doc in actions_ref.where("item_id", "==", item_id).stream():
            doc.reference.delete()

    def save_user_action(self, user_id: str, item_id: str, action_type: str, timestamp):
        actions_ref = self.db.collection("users").document(user_id).collection("actions")
        actions_ref.add({
            "user_id": user_id,
            "item_id": item_id,
            "action": action_type,
            "timestamp": timestamp
        })

    def get_user_actions(self, user_id: str) -> list:
        actions_ref = self.db.collection("users").document(user_id).collection("actions")
        return [doc.to_dict() for doc in actions_ref.stream()]

    def get_latest_user_actions(self, user_id: str) -> dict:
        actions_ref = self.db.collection("users").document(user_id).collection("actions")
        latest = {}
        for doc in actions_ref.stream():
            data = doc.to_dict()
            item_id = data["item_id"]
            prev = latest.get(item_id)
            if not prev or data["timestamp"] > prev["timestamp"]:
                latest[item_id] = data
        return latest

    # --- Chat logic ---
    def _get_conversation_id(self, user1: str, user2: str) -> str:
        return "_".join(sorted([user1, user2]))

    def _ensure_chat_doc(self, user1: str, user2: str):
        conv_id = self._get_conversation_id(user1, user2)
        chat_ref = self.db.collection("chats").document(conv_id)
        if not chat_ref.get().exists:
            now = datetime.utcnow().isoformat() + "Z"
            chat_ref.set({
                "id": conv_id,
                "participants": [user1, user2],
                "created_at": now,
                "status": "active"
            })

    def add_chat_message(self, sender: str, receiver: str, content: str, timestamp: str):
        conv_id = self._get_conversation_id(sender, receiver)
        self._ensure_chat_doc(sender, receiver)
        msg_ref = self.db.collection("chats").document(conv_id).collection("messages")
        msg_ref.add({
            "sender": sender,
            "receiver": receiver,
            "content": content,
            "timestamp": timestamp
        })

    def get_chat_messages(self, user1: str, user2: str, limit: int = 50) -> list:
        conv_id = self._get_conversation_id(user1, user2)
        msg_ref = self.db.collection("chats").document(conv_id).collection("messages")
        msgs = msg_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).stream()
        result = [doc.to_dict() for doc in msgs]
        return list(reversed(result))
