# Firestore database logic for Circloth backend
from firebase_admin import firestore
from typing import List, Optional

class FirestoreDB:
    def delete_user_action(self, user_id: str, item_id: str):
        """Delete all actions for a user and item (so new action can overwrite)."""
        actions_ref = self.db.collection("users").document(user_id).collection("actions")
        for doc in actions_ref.where("item_id", "==", item_id).stream():
            doc.reference.delete()

    def get_latest_user_actions(self, user_id: str) -> dict:
        """Return a dict of item_id -> latest action dict for the user."""
        actions_ref = self.db.collection("users").document(user_id).collection("actions")
        latest = {}
        for doc in actions_ref.stream():
            data = doc.to_dict()
            item_id = data["item_id"]
            prev = latest.get(item_id)
            if not prev or data["timestamp"] > prev["timestamp"]:
                latest[item_id] = data
        return latest
    def __init__(self):
        self.db = firestore.client()

    def get_user(self, user_id: str) -> Optional[dict]:
        doc = self.db.collection("users").document(user_id).get()
        return doc.to_dict() if doc.exists else None

    def update_user(self, user_id: str, data: dict):
        self.db.collection("users").document(user_id).set(data, merge=True)

    def get_item(self, item_id: str) -> Optional[dict]:
        doc = self.db.collection("items").document(item_id).get()
        return doc.to_dict() if doc.exists else None

    def list_items(self, exclude_owner: Optional[str] = None, exclude_ids: Optional[List[str]] = None) -> List[dict]:
        ref = self.db.collection("items")
        query = ref
        if exclude_ids and len(exclude_ids) > 0:
            query = query.where("id", "not-in", exclude_ids)
        docs = [dict(id=doc.id, **doc.to_dict()) for doc in query.stream()]
        if exclude_owner:
            docs = [doc for doc in docs if doc.get("ownerId") != exclude_owner]
        return docs

    def create_item(self, data: dict) -> str:
        doc_ref = self.db.collection("items").add(data)[1]
        return doc_ref.id

    def update_item(self, item_id: str, data: dict):
        self.db.collection("items").document(item_id).set(data, merge=True)

    def delete_item(self, item_id: str):
        self.db.collection("items").document(item_id).delete()

    def list_user_items(self, user_id: str) -> List[dict]:
        ref = self.db.collection("items").where("ownerId", "==", user_id)
        return [dict(id=doc.id, **doc.to_dict()) for doc in ref.stream()]

    def save_user_action(self, user_id: str, item_id: str, action_type: str, timestamp):
        # Store only item_id, action, timestamp
        actions_ref = self.db.collection("users").document(user_id).collection("actions")
        actions_ref.add({
            "item_id": item_id,
            "action": action_type,
            "timestamp": timestamp
        })

    def get_user_actions(self, user_id: str) -> list:
        actions_ref = self.db.collection("users").document(user_id).collection("actions")
        return [doc.to_dict() for doc in actions_ref.stream()]


    # --- Chat message logic ---
    def add_chat_message(self, sender: str, receiver: str, content: str, timestamp: str):
        """Add a chat message between sender and receiver."""
        # Store messages in a collection 'messages', with a conversation id
        conv_id = self._get_conversation_id(sender, receiver)
        msg_ref = self.db.collection("chats").document(conv_id).collection("messages")
        msg_ref.add({
            "sender": sender,
            "receiver": receiver,
            "content": content,
            "timestamp": timestamp
        })

    def get_chat_messages(self, user1: str, user2: str, limit: int = 50) -> list:
        """Get chat messages between user1 and user2, sorted by timestamp ascending."""
        conv_id = self._get_conversation_id(user1, user2)
        msg_ref = self.db.collection("chats").document(conv_id).collection("messages")
        msgs = msg_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).stream()
        result = [doc.to_dict() for doc in msgs]
        return list(reversed(result))

    def _get_conversation_id(self, user1: str, user2: str) -> str:
        """Return a unique conversation id for two users (order-independent)."""
        return "_".join(sorted([user1, user2]))
