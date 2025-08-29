import React, { useState, useEffect } from "react";
import PWAPrompt from "./components/PWAPrompt";
import { useTranslation } from "react-i18next";
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
import changeLanguage from "./utils/changeLanguage";
import { MenuIcon, GlobeIcon } from './utils/svg';

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
            <div style={{ position: "relative" }}>
              <button
                ref={menuButtonRef}
                title="Menu"
                onClick={e => { e.stopPropagation(); setMenuOpen(prev => !prev); }}
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
                <MenuIcon />
              </button>
              {menuOpen && (
                <div
                  ref={menuRef}
                  style={{
                    position: "absolute",
                    top: 36,
                    right: 0,
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
                  <div style={{ marginBottom: 8, fontWeight: 150 }}>
                    <div style={{ fontSize: 15, color: "#333" }}>{appUser?.name || "User"}</div>
                    <div style={{ fontSize: 13, color: "#9b9b9bff" }}>
                      {(() => {
                        const email = appUser?.email || "user@example.com";
                        const maxLen = 17;
                        return email.length > maxLen ? email.slice(0, maxLen) + '...' : email;
                      })()}
                    </div>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid #ddd" }} />
                  {/* Language Switcher - custom dropdown */}
                  <div style={{ position: 'relative', display: "flex", alignItems: "center", gap: 8 }}>
                    <GlobeIcon />
                    <button
                      onClick={() => setLangDropdownOpen((open) => !open)}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        padding: "4px 8px",
                        fontSize: 14,
                        cursor: "pointer",
                        background: '#fff',
                        minWidth: 90,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8
                      }}
                      type="button"
                    >
                      {i18n.language === 'en' ? 'English' : i18n.language === 'es' ? 'Español' : 'Català'}
                      <span style={{ fontSize: 10, marginLeft: 6 }}>▼</span>
                    </button>
                    {langDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 34,
                          left: 28,
                          background: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          zIndex: 200,
                          minWidth: 110,
                          padding: '4px 0',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 16px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: i18n.language === 'en' ? '#15803d' : '#333',
                            fontWeight: i18n.language === 'en' ? 600 : 400,
                          }}
                          onClick={() => {
                            changeLanguage('en');
                            setLangDropdownOpen(false);
                            setMenuOpen(false);
                          }}
                        >English</button>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 16px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: i18n.language === 'es' ? '#15803d' : '#333',
                            fontWeight: i18n.language === 'es' ? 600 : 400,
                          }}
                          onClick={() => {
                            changeLanguage('es');
                            setLangDropdownOpen(false);
                            setMenuOpen(false);
                          }}
                        >Español</button>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 16px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: i18n.language === 'ca' ? '#15803d' : '#333',
                            fontWeight: i18n.language === 'ca' ? 600 : 400,
                          }}
                          onClick={() => {
                            changeLanguage('ca');
                            setLangDropdownOpen(false);
                            setMenuOpen(false);
                          }}
                        >Català</button>
                      </div>
                    )}
                  </div>
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
        <div style={{ height:"100%",position: "relative", width: "80%", marginLeft:"10%", display: "flex", justifyContent: "center", zIndex: 50, marginTop:"90px" }}>
          <AddItem
            user={appUser}
            onItemAdded={() => setRefreshItems(r => r + 1)}
          />
        </div>
      )}

      {/* Main content container, with margin for header and tabs */}
      <div className="main-container">

        {/* Scrollable content */}
        {activeTab === "clothes" && (
          <>
            {true && (
              <ItemList
                user={appUser}
                refreshSignal={refreshItems}
                onModalOpenChange={(open) => {
    console.log("App.js: setItemListModalOpen called with", open);
    setItemListModalOpen(open);
  }}
              />
            )}
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
