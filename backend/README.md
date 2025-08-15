# Circloth FastAPI Backend

This is a Python FastAPI backend for the Circloth app. It provides a REST API for matching clothes between users and is ready to connect to Firebase/Firestore for user and item data.

## Features
- FastAPI server with example `/match` endpoint
- Firebase Admin SDK integration (Firestore)
- Easy to extend for ML-based matching

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Add your Firebase service account key as `serviceAccountKey.json` in this folder, or set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## Example Endpoint
- `POST /match` with JSON `{ "user_id": "..." }` returns a list of items not owned by the user (basic matching example).

## Extending
- Add more endpoints or logic in `main.py` as needed for advanced matching or ML.
