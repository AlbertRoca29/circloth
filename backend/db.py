# Firestore database logic for Circloth backend
from firebase_admin import firestore
from typing import List, Optional
import json
from datetime import datetime


class FirestoreDB:
    def set_item_locked_for(self, item_id: str, locked_for: str):
        """
        Set or clear the 'locked_for' field for an item.
        """
        update = {"locked_for": locked_for}
        self.update_item(item_id, update)

    def get_liked_items_of_profile_by_visitor(self, profile_user_id: str, visitor_user_id: str):
        """
        Returns all items of profile_user_id that were liked by visitor_user_id.
        """
        actions_ref = self.db.collection("actions")
        liked_actions = actions_ref.where("user_id", "==", visitor_user_id).where("action", "==", "like").stream()
        liked_item_ids = [a.to_dict()["item_id"] for a in liked_actions]
        if not liked_item_ids:
            return []
        items_ref = self.db.collection("items")
        items = items_ref.where("ownerId", "==", profile_user_id).where("id", "in", liked_item_ids).stream()
        return [item.to_dict() for item in items]

    def get_all_matches_for_user(self, user_id: str):
        # Fetch all 'like' actions from the global actions collection
        actions_query = self.db.collection("actions").where("action", "==", "like")
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
            docs = self._log_and_get("get_all_matches_for_user_users", users_ref.where("id", "in", list(needed_user_ids)))
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
        chats_query = self.db.collection("chats").where("participants", "array_contains", user_id)
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
        chat_doc = chat_ref.get()
        if not chat_doc.exists:
            # Ensure all mandatory fields are set if chat does not exist
            self._ensure_chat_doc(user1, user2)
        now = datetime.utcnow().isoformat() + "Z"
        chat_ref.set({"last_access": {user_id: now}}, merge=True)

    def delete_item_matches(self, item_id: str):
        batch = self.db.batch()
        actions_query = self.db.collection("actions").where("item_id", "==", item_id).where("action", "==", "like")
        action_docs = self._log_and_get("delete_item_matches", actions_query)
        for doc in action_docs:
            batch.delete(doc.reference)
        batch.commit()

    def delete_item_actions(self, item_id: str):
        batch = self.db.batch()
        actions_query = self.db.collection("actions").where("item_id", "==", item_id)
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

    def update_user(self, user_id: str, updates: dict):
        """
        Updates the user document with the given updates.
        """
        user_ref = self.db.collection("users").document(user_id)
        user_ref.set(updates, merge=True)

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

    def list_items(self, exclude_owner: Optional[str] = None, exclude_ids: Optional[List[str]] = None, limit: int = 50, start_after: Optional[str] = None) -> List[dict]:
        """
        List items with optional filters and pagination support.
        """
        query = self.db.collection("items")

        # Apply filters
        if exclude_owner:
            query = query.where("ownerId", "!=", exclude_owner)
        if exclude_ids and len(exclude_ids) > 0:
            query = query.where("id", "not-in", exclude_ids)

        # Apply pagination
        if start_after:
            start_after_doc = self.db.collection("items").document(start_after).get()
            if start_after_doc.exists:
                query = query.start_after(start_after_doc)

        # Limit the number of results
        query = query.limit(limit)

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
        query = self.db.collection("items").where("ownerId", "==", user_id)
        docs = [self._doc_with_id(doc) for doc in self._log_and_stream("list_user_items", query)]
        return docs

    # --- User Actions ---
    def delete_user_action(self, user_id: str, item_id: str):
        actions_query = self.db.collection("actions").where("user_id", "==", user_id).where("item_id", "==", item_id)
        for doc in self._log_and_stream("delete_user_action", actions_query):
            doc.reference.delete()

    def save_user_action(self, user_id: str, item_id: str, action_type: str, timestamp):
        actions_ref = self.db.collection("actions")
        actions_ref.add({
            "user_id": user_id,
            "item_id": item_id,
            "action": action_type,
            "timestamp": timestamp
        })

    def get_user_actions(self, user_id: str) -> list:
        """
        Fetch all actions for a user from the global actions collection.
        """
        actions_query = self.db.collection("actions").where("user_id", "==", user_id)
        actions = [doc.to_dict() for doc in self._log_and_stream("get_user_actions", actions_query)]
        return actions

    def get_latest_user_actions(self, user_id: str) -> dict:
        """
        Fetch the latest action for each item_id for a user from the global actions collection.
        """
        actions_query = (
            self.db.collection("actions")
            .where("user_id", "==", user_id)
            .order_by("item_id")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
        )

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
        now = datetime.utcnow().isoformat() + "Z"
        # Prepare all mandatory fields
        mandatory_fields = {
            "id": conv_id,
            "participants": [user1, user2],
            "created_at": now,
            "status": "active",
            "last_access": {user1: now, user2: now}
        }
        if not chat_doc.exists:
            chat_query.set(mandatory_fields)
        else:
            # Update any missing mandatory fields
            update_fields = {}
            doc_data = chat_doc.to_dict() or {}
            for k, v in mandatory_fields.items():
                if k not in doc_data or doc_data[k] is None:
                    update_fields[k] = v
            if update_fields:
                chat_query.set(update_fields, merge=True)

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
        # Always update last_message after sending
        self._ensure_last_message_cached(conv_id)

    def get_chat_messages(self, user1: str, user2: str, limit: int = 50, start_after: Optional[str] = None) -> list:
        """
        Fetch chat messages between two users with pagination support.
        """
        conv_id = self._get_conversation_id(user1, user2)
        msg_query = self.db.collection("chats").document(conv_id).collection("messages").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit)

        # Apply pagination if start_after is provided
        if start_after:
            start_after_doc = self.db.collection("chats").document(conv_id).collection("messages").document(start_after).get()
            if start_after_doc.exists:
                msg_query = msg_query.start_after(start_after_doc)

        msgs = self._log_and_stream("get_chat_messages", msg_query)
        result = [doc.to_dict() for doc in msgs]
        return list(reversed(result))

    def _ensure_last_message_cached(self, conv_id: str):
        """
        Ensure the last message is cached in the parent chat document.
        """
        chat_ref = self.db.collection("chats").document(conv_id)
        last_msg_query = (
            chat_ref.collection("messages")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(1)
        )
        last_msg_docs = list(last_msg_query.stream())
        if last_msg_docs:
            last_message = last_msg_docs[0].to_dict()
            chat_ref.set({"last_message": last_message}, merge=True)


# # --- Custom Admin Logic ---
#     def delete_passed_items_field(self, user_id: str):
#         """
#         Deletes the 'passed_items' field from the user document for the given user_id.
#         """
#         user_ref = self.db.collection("users").document(user_id)
#         user_ref.update({"passed_items": firestore.DELETE_FIELD})

#     def delete_passed_items_field_all_users(self):
#         """
#         Deletes the 'passed_items' field from all user documents.
#         """
#         users_ref = self.db.collection("users")
#         user_docs = users_ref.stream()
#         print(user_docs)
#         batch = self.db.batch()
#         for user_doc in user_docs:
#             print(f"Deleting 'passed_items' for user {user_doc.id}")
#             batch.update(user_doc.reference, {"passed_items": firestore.DELETE_FIELD})
#         batch.commit()

#     def copy_all_user_actions_to_global(self):
#         """
#         Copies all documents from each user's 'actions' subcollection to a global 'actions' collection.
#         Uses the same document ID as the original action document.
#         """
#         users_ref = self.db.collection("users")
#         user_docs = list(users_ref.stream())
#         actions_ref = self.db.collection("actions")
#         total_users = len(user_docs)
#         total_actions = 0
#         print(f"[DEBUG] Found {total_users} users.")
#         for idx, user_doc in enumerate(user_docs):
#             user_id = user_doc.id
#             print(f"[DEBUG] Processing user {idx+1}/{total_users}: {user_id}")
#             actions_sub = list(users_ref.document(user_id).collection("actions").stream())
#             print(f"[DEBUG]   Found {len(actions_sub)} actions for user {user_id}.")
#             for action_doc in actions_sub:
#                 data = action_doc.to_dict()
#                 # Ensure user_id is present in the action data
#                 data["user_id"] = user_id
#                 actions_ref.document(action_doc.id).set(data)
#                 total_actions += 1
#         print(f"[DEBUG] Finished copying. Total actions copied: {total_actions}")
