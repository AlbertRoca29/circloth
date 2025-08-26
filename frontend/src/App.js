import React, { useState, useEffect } from "react";
import PWAPrompt from "./components/PWAPrompt";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { auth, logOut } from "./utils/firebase";
import { onAuthStateChanged } from "firebase/auth";

import LoginPage from "./pages/LoginPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AddItem from "./components/AddItem";
import ItemList from "./components/ItemList";
import ProfilePage from "./pages/ProfilePage";
import Tabs from "./components/Tabs";

import Matching from "./pages/Matching";
import "./styles/App.css";
import BACKEND_URL from "./config";
import Chats from "./pages/Chats";

import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";

function App() {
  const { i18n, t } = useTranslation();
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase auth user
  const [appUser, setAppUser] = useState(null);           // Backend user profile
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("clothes");
  const [hasClothes, setHasClothes] = useState(false);
  const [refreshItems, setRefreshItems] = useState(0);
  // Location permission tracking hidden for future release
  // const [matchingLocation, setMatchingLocation] = useState(null); // null=unknown, true=open, false=closed

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

  // Detect mobile device
  function isMobile() {
    return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
  }

  useEffect(() => {
    const handler = (e) => {
      // Only show on mobile and if not already installed
      if (isMobile() && window.matchMedia('(display-mode: standalone)').matches === false) {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPWAPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setShowPWAPrompt(false);
        setDeferredPrompt(null);
      });
    }
  };

  // Scroll to top when switching to Matching or Chats tab
  useEffect(() => {
    if (activeTab === "matching" || activeTab === "chats") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);
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
          const res = await fetch(`${BACKEND_URL}/user/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setAppUser({ ...user, ...data });
            // Set language from user profile if exists
            if (data.language) {
              i18n.changeLanguage(data.language);
            }
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
  }, [i18n]);

  // Listen for clothing items to enable Matching tab
  useEffect(() => {
    if (!appUser) {
      setHasClothes(false);
      return;
    }
    // Fetch items from backend
    fetch(`${BACKEND_URL}/items/${appUser.uid}`)
      .then(res => res.json())
      .then(data => setHasClothes(data.items && data.items.length > 0))
      .catch(() => setHasClothes(false));
  }, [appUser, refreshItems]);

  // Track if ItemList modal is open
  const [itemListModalOpen, setItemListModalOpen] = useState(false);
  useEffect(() => {
    window.onItemListModalOpen = setItemListModalOpen;
    return () => { window.onItemListModalOpen = undefined; };
  }, []);

  // Track if Chats modal is open
  const [chatsModalOpen, setChatsModalOpen] = useState(false);

  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      navigate(-1); // Navigate to the previous route
    };

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [navigate]);

  if (loading) return null;

  // If no user or appUser → show login page
  if (!firebaseUser || !appUser) {
    return (
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="*" element={<LoginPage firebaseUser={firebaseUser} setAppUser={setAppUser} />} />
      </Routes>
    );
  }

  // Main logged-in UI
  return (
    <>
      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <PWAPrompt onInstall={handleInstall} onClose={() => setShowPWAPrompt(false)} />
      )}
      {/* Header - fixed, outside main-container */}
  {!itemListModalOpen && !chatsModalOpen && (
        <div className="header-bubble">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <h1 style={{
              color: "var(--primary-dark, #15803d)",
              fontWeight: 600,
              fontSize: "clamp(1.66rem, 1.5vw, 2.5rem)",
              margin: 0,
              marginLeft: "12px",
              letterSpacing: "0.04em",
              fontFamily: "Geist, Geist Sans, Segoe UI, Arial, sans-serif"
            }}>
              Circloth
            </h1>
            {/* LanguageSwitcher will be a planet icon button next to profile icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 28, position: 'relative' }}>
              <span style={{
                fontWeight: 125,
                color: "var(--gray-text, #495566ff)",
                marginRight: "0%",
                fontSize: "1rem",
                letterSpacing: "0.01em"
              }}>
                {/* Hi, {appUser.name || appUser.displayName} */}
              </span>
              {/* Language planet icon button */}
              <LanguageSwitcher />
              <button
                title={t('profile')}
                onClick={() => setShowProfile(true)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24"
                  fill="none" stroke="var(--primary-dark, #15803d)"
                  strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"/>
                </svg>
              </button>
              <button
                title={t('logout')}
                onClick={logOut}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  marginRight: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24"
                  fill="none" stroke="var(--danger, #e11d48)"
                  strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content container, with margin for header and tabs */}
      <div className="main-container">
        {/* Scrollable content */}
        {activeTab === "clothes" && (
          <>
            {!itemListModalOpen && (
              <AddItem
                user={appUser}
                onItemAdded={() => setRefreshItems(r => r + 1)}
              />
            )}
            <ItemList
              user={appUser}
              refreshSignal={refreshItems}
              onModalOpenChange={setItemListModalOpen}
            />
          </>
        )}
        {activeTab === "matching" && (
          <>
            <Matching user={appUser} />
          </>
        )}
        {activeTab === "chats" && (
          <React.Suspense fallback={<div className="card">Loading chats...</div>}>
            <Chats user={appUser} onModalOpenChange={setChatsModalOpen} />
          </React.Suspense>
        )}
      </div>

      {/* Floating Tabs - fixed, outside main-container */}
  {!itemListModalOpen && !chatsModalOpen && (
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasClothes={hasClothes}
        />
      )}

      {showProfile && (
        <ProfilePage
          user={appUser}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}

export default App;
