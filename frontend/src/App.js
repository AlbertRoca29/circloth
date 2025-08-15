import React, { useState, useEffect } from "react";
import { auth, logOut } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import LoginPage from "./LoginPage";
import AddItem from "./AddItem";
import ItemList from "./ItemList";
import ProfilePage from "./ProfilePage";
import Tabs from "./Tabs";
import Matching from "./Matching";
import "./Common.css";

function App() {
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase auth user
  const [appUser, setAppUser] = useState(null);           // Backend user profile
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("clothes");
  const [hasClothes, setHasClothes] = useState(false);
  const [refreshItems, setRefreshItems] = useState(0);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAppUser(null);
        setLoading(false);
      } else {
        // Fetch user profile from backend
        try {
          const res = await fetch(`http://localhost:8000/user/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setAppUser({ ...user, ...data });
          } else {
            setAppUser(null); // triggers LoginPage for extra info
          }
        } catch {
          setAppUser(null);
        }
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Listen for clothing items to enable Matching tab
  useEffect(() => {
    if (!appUser) {
      setHasClothes(false);
      return;
    }
    // Fetch items from backend
    fetch(`http://localhost:8000/items/${appUser.uid}`)
      .then(res => res.json())
      .then(data => setHasClothes(data.items && data.items.length > 0))
      .catch(() => setHasClothes(false));
  }, [appUser, refreshItems]);

  if (loading) return null;

  // If no user or appUser → show login page
  if (!firebaseUser || !appUser) {
    return <LoginPage firebaseUser={firebaseUser} setAppUser={setAppUser} />;
  }

  // Main logged-in UI
  return (
    <div className="main-container">
      <div className="header-bubble">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 style={{ color: "var(--primary-dark, #15803d)", fontWeight: 800, fontSize: "2rem", margin: 0, letterSpacing: "0.01em", fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>Circloth</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <span style={{ fontWeight: 500, color: "var(--gray-text, #64748b)", marginRight: 18, fontSize: "1.13rem", letterSpacing: "0.01em" }}>
              Hi, {appUser.name || appUser.displayName}
            </span>
            <button title="Profile" onClick={() => setShowProfile(true)} style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark, #15803d)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"/></svg>
            </button>
            <button title="Log Out" onClick={logOut} style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} hasClothes={hasClothes} />
      <div>
        {activeTab === "clothes" && <>
          <AddItem user={appUser} onItemAdded={() => setRefreshItems(r => r + 1)} />
          <ItemList user={appUser} refreshSignal={refreshItems} />
        </>}
        {activeTab === "matching" && <Matching user={appUser} />}
        {activeTab === "chats" && (
          <div className="card" style={{ textAlign: "center", color: "var(--gray-text, #64748b)", fontSize: "1.2rem", marginTop: 40 }}>
            <p>Chats feature coming soon!</p>
          </div>
        )}
      </div>

      {showProfile && <ProfilePage user={appUser} onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export default App;
