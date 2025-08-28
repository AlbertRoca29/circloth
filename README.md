# Circloth

👕 **Give away clothes that once meant something to you**

➡️ **Receive items that carry someone else’s story.**

Circloth is a platform for swapping clothes.

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Python 3**: [Download Python](https://www.python.org/downloads/)
- **Node.js**: [Download Node.js](https://nodejs.org/)

---

## Getting Started

Follow these steps to set up and run Circloth locally. The backend and frontend can be set up in any order.

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set the allowed origins environment variable:
   - On Linux/Mac:
     ```bash
     export ALLOWED_ORIGINS="http://localhost:3000"
     ```
   - On Windows (Command Prompt):
     ```cmd
     set ALLOWED_ORIGINS="http://localhost:3000"
     ```

4. Start the backend server using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

The backend will now be running at `http://localhost:8000`.

---

### 2. Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Update the backend URL in the configuration file:
   - Open `frontend/src/config.js` and set the `BACKEND_URL` variable to:
     ```javascript
     BACKEND_URL = "http://localhost:8000";
     ```

3. Install the required Node.js dependencies:
   ```bash
   npm install
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

The frontend will now be running at `http://localhost:3000`.

---

## Notes

- The backend hosted on the cloud only accepts calls from `circloth.com`. Therefore, you must run the backend locally for development purposes.
- Ensure both the backend and frontend are running simultaneously for the application to function correctly.

---

## Collaborators

- **[Albert Roca Llevadot](https://github.com/AlbertRoca29)**: Currently handling most aspects of the project.
- **Chris Morse**: Provided meaningful contributions to user experience (UX) design.
- **Violeta Hernandez**: Contributed to the initial idea and naming of the app.
- **Viri Buxadé**: Assisted with logo design and branding.
- **Sala Family**: Offered business strategy and operational support.
- **Albert's Family**: Provided continuous encouragement and support throughout the project.
