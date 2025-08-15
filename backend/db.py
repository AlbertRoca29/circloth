# Firestore database logic for Circloth backend
from firebase_admin import firestore
from typing import List, Optional

class FirestoreDB:
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
