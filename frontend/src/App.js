import React, { useState, useEffect } from "react";
import PWAPrompt from "./components/PWAPrompt";
import { useTranslation } from "react-i18next";
import { auth, logOut } from "./utils/firebase";
import { onAuthStateChanged } from "firebase/auth";

import LoginPage from "./pages/LoginPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AddItem from "./components/AddItem";
import ItemList from "./components/ItemList";
import Tabs from "./components/Tabs";

import Matching from "./pages/Matching";
import "./styles/App.css";
import BACKEND_URL from "./config";
import Chats from "./pages/Chats";
import { MenuIcon } from './utils/svg';
import SizeSelectionModal from "./components/SizeSelectionModal";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { fetchUserItems } from "./api/itemApi";

import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";

function App() {
  const { i18n, t } = useTranslation();
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase auth user
  const [appUser, setAppUser] = useState(null);           // Backend user profile
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("matching");
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

  // Scroll to top and refresh unread when switching to Matching or Chats tab
  useEffect(() => {
    if (activeTab === "chats") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    //   setRefreshUnread(r => r + 1);
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
    fetchUserItems(appUser.uid)
      .then(res => res.json())
      .then(data => setHasClothes(data.items && data.items.length > 0))
      .catch(() => setHasClothes(false));
  }, [appUser, refreshItems]);

  // Track if ItemList modal is open
  const [itemListModalOpen, setItemListModalOpen] = useState(false);
  // Track if AddItem is open
  const [addItemOpen, setAddItemOpen] = useState(false);
  useEffect(() => {
    window.onItemListModalOpen = setItemListModalOpen;
    return () => { window.onItemListModalOpen = undefined; };
  }, []);

  // Close AddItem form when switching to another tab
  useEffect(() => {
    if (activeTab !== 'clothes' && addItemOpen) {
      setAddItemOpen(false);
    }
  }, [activeTab, addItemOpen]);

  // Track if Chats modal is open
  const [chatsModalOpen, setChatsModalOpen] = useState(false);
  // Track if any chat is unread
  const [hasUnreadChats, setHasUnreadChats] = useState(false);
  // Used to trigger unread refresh
  const [refreshUnread, setRefreshUnread] = useState(0);

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


  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef(null);
  const menuButtonRef = React.useRef(null);

  // Language dropdown state
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Close menu or language dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen && !langDropdownOpen) return;
    function handleClickOutside(event) {
      // Prevent if already handled by menu button
      if (event.cancelBubble) return;
      // Don't close if clicking the menu button
      if (
        (menuButtonRef.current && menuButtonRef.current.contains(event.target)) ||
        (menuRef.current && menuRef.current.contains(event.target))
      ) {
        return;
      }
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, langDropdownOpen]);

  const [showSizeSelection, setShowSizeSelection] = useState(false);
  // Show size selection only if user has no size_preferences
  useEffect(() => {
    if (appUser && ( !appUser.size_preferences || Object.keys(appUser.size_preferences).length === 0 )) {
      setShowSizeSelection(true);
    } else {
      setShowSizeSelection(false);
    }
  }, [appUser]);

  const handleSizeSave = (sizes) => {
    setShowSizeSelection(false);
  };

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
    <div>
      <div style={{
        position: "fixed",
        top: 0,
        left: "50vw",
        transform: "translateX(-50%)",
        width: "100%",
        background: activeTab === "matching" ? "transparent" : "var(--primary-light)",
        boxShadow: "0 8px 19px var(--shadow)",
        padding: "2.25vh 0 1.45vh 0",
        zIndex: 500,
        margin: "0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {activeTab === 'matching' ? (
            <img
              src={process.env.PUBLIC_URL + '/logo512.png'}
              alt="Circloth Logo"
              style={{ height: '2.5rem', marginLeft: '5vw', objectFit: 'contain', userSelect: 'none' }}
              draggable={false}
            />
          ) : (
            <>
              <h1 style={{
                color: "var(--primary-dark, #15803d)",
                fontWeight: 600,
                fontSize: "1.45rem",
                margin: 0,
                marginLeft: "5vw",
                letterSpacing: "0.04em"
              }}>
                Circloth
              </h1>
              <img
                src={process.env.PUBLIC_URL + '/logo512.png'}
                alt="Circloth Logo"
                style={{ height: '2.5rem', marginLeft: '1vw', objectFit: 'contain', userSelect: 'none' }}
                draggable={false}
              />
            </>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <button
            ref={menuButtonRef}
            title="Menu"
            onClick={e => { e.stopPropagation(); setMenuOpen(prev => !prev); }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              marginRight: "10vw",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <MenuIcon />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              style={{
                position: "absolute",
                top: 36,
                right: '5vw',
                background: "#fff",
                border: "1px solid var(--primary-dark, #15803d)",
                borderRadius: 9,
                boxShadow: "0 4px 16px rgba(34,197,94,0.13)",
                padding: 10,
                zIndex: 100,
                width: '160px',
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              {/* User Info */}
              <div style={{ marginBottom: 5 }}>
                <div style={{ fontSize: '0.9rem', color: "#333", fontWeight: 150 }}>{appUser?.name || "User"}</div>
                <div style={{ fontSize: '0.75rem', color: "#9b9b9bff", fontFamily: 'Geist Mono', fontWeight: 400 }}>
                  {(() => {
                    const email = appUser?.email || "user@example.com";
                    const maxLen = 20;
                    return email.length > maxLen ? email.slice(0, maxLen) + '...' : email;
                  })()}
                </div>
              </div>
              {/* Language Switcher - custom dropdown */}
              <LanguageSwitcher
                position="relative"
                top={0}
                right={0}
                zIndex={200}
                dropdownStyle={{ minWidth: "150px" }}
                buttonStyle={{ fontSize: "0.82rem" }}
                displayFullLanguageName={true}
                appUser={appUser}
              />
              {/* Logout Button */}
              <button
                onClick={() => {
                  logOut();
                  setMenuOpen(false);
                }}
                style={{
                  background: "var(--danger, #e11d48)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: 8
                }}
              >
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* Floating AddItem Button */}
      {!itemListModalOpen && !chatsModalOpen && activeTab === "clothes" && (
        <div style={{ height:"100%",position: "relative", display: "flex", zIndex: 50, marginTop:"9dvh", justifyContent: "center", alignItems: "center" }}>
          <AddItem
            user={appUser}
            onItemAdded={() => setRefreshItems(r => r + 1)}
            open={addItemOpen}
            setOpen={setAddItemOpen}
          />
        </div>
      )}

      {/* Main content container, flex column, scrollable middle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "70dvh",
          width: "100%",
          fontFamily: 'Geist',
          fontWeight: 100,
          background: "none",
          boxSizing: "border-box",
          transition: "transform 0.1s",
        }}
      >
        {/* Spacer for fixed header (height: ~64px) */}
        <div style={{ height: '0px', flexShrink: 0 }} />
        {/* Scrollable content area */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            width: '100%',
            paddingBottom: '80px', // space for tabs
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          {activeTab === "clothes" && !addItemOpen && (
            <ItemList
              user={appUser}
              refreshSignal={refreshItems}
              onModalOpenChange={(open) => { setItemListModalOpen(open); }}
            />
          )}
          {activeTab === "matching" && (
            <Matching user={appUser} />
          )}
          {activeTab === "chats" && (
            <React.Suspense fallback={<div className="card">Loading chats...</div>}>
              <Chats
                user={appUser}
                onModalOpenChange={setChatsModalOpen}
                onUnreadChange={setHasUnreadChats}
                refreshUnread={refreshUnread}
                onChatClose={() => setRefreshUnread(r => r + 1)}
              />
            </React.Suspense>
          )}
        </div>
      </div>



      {/* Floating Tabs - fixed, outside main-container */}
  {!itemListModalOpen && !chatsModalOpen && (
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasClothes={hasClothes}
          hasUnreadChats={hasUnreadChats}
        />
      )}


      {showSizeSelection && (
        <SizeSelectionModal
          onClose={() => setShowSizeSelection(false)}
          onSave={handleSizeSave}
          userId={appUser.id}
        />
      )}
    </>
  );
}

export default App;
