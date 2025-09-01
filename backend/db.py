# Firestore database logic for Circloth backend
from firebase_admin import firestore
from typing import List, Optional
import json
from datetime import datetime


class FirestoreDB:
    def get_liked_items_of_profile_by_visitor(self, profile_user_id: str, visitor_user_id: str):
        """
        Returns all items of profile_user_id that were liked by visitor_user_id.
        """
        # Get all 'like' actions by visitor_user_id
        actions_ref = self.db.collection("users").document(visitor_user_id).collection("actions")
    liked_actions = actions_ref.where(filter=("action", "==", "like")).stream()
        liked_item_ids = [a.to_dict()["item_id"] for a in liked_actions]
        if not liked_item_ids:
            return []
        # Get all items owned by profile_user_id that are in liked_item_ids
        items_ref = self.db.collection("items")
    items = items_ref.where(filter=("ownerId", "==", profile_user_id)).where(filter=("id", "in", liked_item_ids)).stream()
        return [item.to_dict() for item in items]

    def get_all_matches_for_user(self, user_id: str):
        """
        Optimized to minimize Firestore calls using collection group query (requires index).
        """
        # Fetch all 'like' actions for all users (except current) in one collection group query
    actions_query = self.db.collection_group("actions").where(filter=("action", "==", "like"))
        all_actions = self._log_and_stream("get_all_matches_for_user", actions_query)

        # Fetch all items once for lookup
        all_items = {i.id: i.to_dict() for i in self.db.collection("items").stream()}

        # Process actions and items
        my_items = {item["id"]: item for item in self.list_user_items(user_id)}
        my_item_ids = set(my_items.keys())
        my_likes = set()
        received_likes = {}

        for act_doc in all_actions:
            act = act_doc.to_dict()
            other_id = act.get("user_id")
            item_id = act.get("item_id")

            if other_id == user_id:
                my_likes.add(item_id)
            elif item_id in my_item_ids:
                received_likes[(other_id, item_id)] = True

        # Collect all their_user_ids needed
        needed_user_ids = set()
        for liked_item_id in my_likes - my_item_ids:
            their_item = all_items.get(liked_item_id)
            if not their_item:
                continue
            their_user_id = their_item.get("ownerId")
            if not their_user_id or their_user_id == user_id:
                continue
            needed_user_ids.add(their_user_id)

        # Batch fetch all needed user docs
        user_docs = {}
        if needed_user_ids:
            users_ref = self.db.collection("users")
            # Firestore batch get
            docs = self._log_and_get("get_all_matches_for_user_users", users_ref.where(filter=("id", "in", list(needed_user_ids))))
            for doc in docs:
                user_docs[doc.id] = doc.to_dict()

        # Build matches
        grouped = {}
        for liked_item_id in my_likes - my_item_ids:  # only items not owned by user
            their_item = all_items.get(liked_item_id)
            if not their_item:
                continue
            their_user_id = their_item.get("ownerId")
            if not their_user_id or their_user_id == user_id:
                continue

            # Check reciprocal like
            for my_item_id in my_item_ids:
                if received_likes.get((their_user_id, my_item_id)):
                    key = (their_user_id, liked_item_id)
                    if key not in grouped:
                        other_user = user_docs.get(their_user_id) or {"id": their_user_id}
                        grouped[key] = {
                            "id": f"{user_id}_{their_user_id}_{liked_item_id}",
                            "otherUser": other_user,
                            "theirItem": their_item,
                            "yourItems": []
                        }
                    grouped[key]["yourItems"].append(my_items[my_item_id])

        return list(grouped.values())

    def __init__(self):
        self.read_counts = {}
        self.log_file = "firestore_read_log.json"
        # Ensure Firestore client is initialized once and reused
        if not hasattr(FirestoreDB, "_db_client"):
            FirestoreDB._db_client = firestore.client()
        self.db = FirestoreDB._db_client

    def _log_read(self, function_name):
        if function_name not in self.read_counts:
            self.read_counts[function_name] = 0
        self.read_counts[function_name] += 1
        self._write_log()

    def _write_log(self):
        try:
            with open(self.log_file, "r") as f:
                existing_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = {}

        # Merge existing data with current read counts
        for key, value in self.read_counts.items():
            if key in existing_data:
                existing_data[key] += value
            else:
                existing_data[key] = value

        with open(self.log_file, "w") as f:
            json.dump(existing_data, f, indent=4)

        # Reset in-memory read counts after writing to file
        self.read_counts = {}


    def _log_and_get(self, function_name, ref, *args, **kwargs):
        result = ref.get(*args, **kwargs)
        self._log_read(function_name)
        return result

    def _log_and_stream(self, function_name, ref, *args, **kwargs):
        result = ref.stream(*args, **kwargs)
        self._log_read(function_name)
        return result

    def list_user_chats(self, user_id: str):
        # Fetch all chats where user is a participant
    chats_query = self.db.collection("chats").where(filter=("participants", "array_contains", user_id))
        chat_docs = self._log_and_get("list_user_chats", chats_query)
        chats = []

        for doc in chat_docs:
            chat = doc.to_dict()
            chat_id = chat["id"]

            # Use last_message field if available for efficiency
            last_message = chat.get("last_message")
            last_msg_ts = last_message["timestamp"] if last_message else None
            last_access = chat.get("last_access", {}).get(user_id)
            is_unread = last_msg_ts and last_access and last_msg_ts > last_access

            chat["is_unread"] = is_unread
            chat["last_message"] = last_message

            # Fallback: fetch last message if not present in chat doc
            if not last_message:
                msg_query = (
                    self.db.collection("chats")
                    .document(chat_id)
                    .collection("messages")
                    .order_by("timestamp", direction=firestore.Query.DESCENDING)
                    .limit(1)
                )
                last_msg_docs = self._log_and_get("list_user_chats_last_message", msg_query)
                last_msg = list(last_msg_docs)
                chat["last_message"] = last_msg[0].to_dict() if last_msg else None
                last_msg_ts = chat["last_message"]["timestamp"] if chat["last_message"] else None
                chat["is_unread"] = last_msg_ts and last_access and last_msg_ts > last_access

            chats.append(chat)

        return chats

    def update_chat_last_access(self, user1: str, user2: str, user_id: str):
        conv_id = self._get_conversation_id(user1, user2)
        chat_ref = self.db.collection("chats").document(conv_id)
        now = datetime.utcnow().isoformat() + "Z"
        chat_ref.set({"last_access": {user_id: now}}, merge=True)

    def delete_item_matches(self, item_id: str):
        users_query = self.db.collection("users")
        user_docs = self._log_and_get("delete_item_matches", users_query)
        batch = self.db.batch()

        for user_doc in user_docs:
            user_id = user_doc.id
            actions_query = users_query.document(user_id).collection("actions").where(filter=("item_id", "==", item_id)).where(filter=("action", "==", "like"))
            action_docs = self._log_and_get("delete_item_matches", actions_query)
            for doc in action_docs:
                batch.delete(doc.reference)

        batch.commit()

    def delete_item_actions(self, item_id: str):
        users_query = self.db.collection("users")
        user_docs = self._log_and_get("delete_item_actions", users_query)
        batch = self.db.batch()

        for user_doc in user_docs:
            user_id = user_doc.id
            actions_query = users_query.document(user_id).collection("actions").where(filter=("item_id", "==", item_id))
            action_docs = self._log_and_get("delete_item_actions", actions_query)
            for doc in action_docs:
                batch.delete(doc.reference)

        batch.commit()

    def _doc_with_id(self, doc):
        data = doc.to_dict() or {}
        data['id'] = doc.id
        return data

    # --- User logic ---
    def get_user(self, user_id: str) -> Optional[dict]:
        user_query = self.db.collection("users").document(user_id)
        user_doc = self._log_and_get("get_user", user_query)
        return user_doc.to_dict() if user_doc.exists else None

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
        item_query = self.db.collection("items").document(item_id)
        item_doc = self._log_and_get("get_item", item_query)
        return item_doc.to_dict() if item_doc.exists else None

    def list_items(self, exclude_owner: Optional[str] = None, exclude_ids: Optional[List[str]] = None) -> List[dict]:
        query = self.db.collection("items")
        if exclude_owner:
            query = query.where(filter=("ownerId", "!=", exclude_owner))
        if exclude_ids and len(exclude_ids) > 0:
            query = query.where(filter=("id", "not-in", exclude_ids))
        docs = [self._doc_with_id(doc) for doc in self._log_and_stream("list_items", query)]
        return docs

    def create_item(self, data: dict) -> str:
        now = datetime.utcnow().isoformat() + "Z"
        data["created_at"] = now
        data["updated_at"] = now
        item_id = data["id"]  # Use the provided ID
        self.db.collection("items").document(item_id).set(data)  # Save the item with the provided ID
        return item_id

    def update_item(self, item_id: str, data: dict):
        data["updated_at"] = datetime.utcnow().isoformat() + "Z"
        self.db.collection("items").document(item_id).set(data, merge=True)

    def delete_item(self, item_id: str):
        self.db.collection("items").document(item_id).delete()

    def list_user_items(self, user_id: str) -> List[dict]:
    query = self.db.collection("items").where(filter=("ownerId", "==", user_id))
        docs = [self._doc_with_id(doc) for doc in self._log_and_stream("list_user_items", query)]
        return docs

    # --- User Actions ---
    def delete_user_action(self, user_id: str, item_id: str):
    actions_query = self.db.collection("users").document(user_id).collection("actions").where(filter=("item_id", "==", item_id))
        for doc in self._log_and_stream("delete_user_action", actions_query):
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
        actions_query = self.db.collection("users").document(user_id).collection("actions")
        actions = [doc.to_dict() for doc in self._log_and_stream("get_user_actions", actions_query)]
        return actions

    def get_latest_user_actions(self, user_id: str) -> dict:
        actions_query = self.db.collection("users").document(user_id).collection("actions") \
            .order_by("item_id") \
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
        latest = {}
        for doc in self._log_and_stream("get_latest_user_actions", actions_query):
            data = doc.to_dict()
            item_id = data["item_id"]
            if item_id not in latest:
                latest[item_id] = data  # First occurrence is the latest due to ordering
        return latest

    # --- Chat logic ---
    def _get_conversation_id(self, user1: str, user2: str) -> str:
        return "_".join(sorted([user1, user2]))

    def _ensure_chat_doc(self, user1: str, user2: str):
        conv_id = self._get_conversation_id(user1, user2)
        chat_query = self.db.collection("chats").document(conv_id)
        chat_doc = self._log_and_get("_ensure_chat_doc", chat_query)
        if not chat_doc.exists:
            now = datetime.utcnow().isoformat() + "Z"
            chat_query.set({
                "id": conv_id,
                "participants": [user1, user2],
                "created_at": now,
                "status": "active",
                "last_access": {user1: now, user2: now}
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
        msg_query = self.db.collection("chats").document(conv_id).collection("messages").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit)
        msgs = self._log_and_stream("get_chat_messages", msg_query)
        result = [doc.to_dict() for doc in msgs]
        return list(reversed(result))
