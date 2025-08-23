import React, { useState, useEffect } from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import "./Common.css";
import BACKEND_URL from "./config";

function LoginPage({ firebaseUser, setAppUser }) {
  const [localName, setLocalName] = useState("");
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [needsExtraInfo, setNeedsExtraInfo] = useState(() => {
    try {
      return localStorage.getItem('needsExtraInfo') === 'true';
    } catch {
      return false;
    }
  });
  const [pendingUser, setPendingUser] = useState(() => {
    try {
      const u = localStorage.getItem('pendingUser');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    try {
      if (needsExtraInfo) {
        localStorage.setItem('needsExtraInfo', 'true');
      } else {
        localStorage.removeItem('needsExtraInfo');
      }
    } catch {}
  }, [needsExtraInfo]);
  useEffect(() => {
    try {
      if (pendingUser) {
        localStorage.setItem('pendingUser', JSON.stringify(pendingUser));
      } else {
        localStorage.removeItem('pendingUser');
      }
    } catch {}
  }, [pendingUser]);

  const handleGoogleClick = async () => {
    try {
      // Detect mobile device
      const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
      let user = null;
      if (isMobile) {
        await signInWithRedirect(auth, provider);
        // On redirect, Firebase will handle the login and reload the app, so we don't need to do anything else here.
        return;
      } else {
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      }
      // Try to fetch user profile from backend
      if (user) {
        const res = await fetch(`${BACKEND_URL}/user/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setAppUser({ ...user, ...data });
          setPendingUser(null);
          setNeedsExtraInfo(false);
        } else {
          // New user → ask extra info
          setPendingUser(user);
          setNeedsExtraInfo(true);
        }
      }
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  };

  const handleSignIn = async () => {
    if (!localName.trim() || !privacyChecked || !pendingUser) return;
    try {
      // Collect device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: { width: window.screen.width, height: window.screen.height },
      };
      // Create user in backend
      const res = await fetch(`${BACKEND_URL}/user/${pendingUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pendingUser.uid,
          name: localName,
          email: pendingUser.email,
          passed_items: [],
          device_info: deviceInfo
        })
      });
      if (res.ok) {
        setAppUser({ ...pendingUser, name: localName });
        setPendingUser(null);
        setNeedsExtraInfo(false);
        setLocalName("");
        setPrivacyChecked(false);
        localStorage.removeItem('pendingUser');
        localStorage.removeItem('needsExtraInfo');
      } else {
        throw new Error("Failed to create user profile");
      }
    } catch (err) {
      console.error("Sign-in failed:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ minWidth: 320, display: "flex", flexDirection: "column", alignItems: "center" }}>
  <h2 style={{ color: "var(--primary-dark, #15803d)", fontWeight: 800, fontSize: "2rem", marginBottom: "1.5rem", letterSpacing: "0.01em", fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>Welcome to Circloth</h2>

        {needsExtraInfo && (
          <>
            <input
              className="input"
              type="text"
              placeholder="Enter your name"
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              style={{ marginBottom: "1.2rem" }}
            />
            <label className="label" style={{ marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={e => setPrivacyChecked(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              I agree to the <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary, #22c55e)", textDecoration: "underline" }}>Privacy Policy</a>
            </label>
          </>
        )}

        <button
          className="btn"
          onClick={needsExtraInfo ? handleSignIn : handleGoogleClick}
          disabled={needsExtraInfo && (!localName.trim() || !privacyChecked)}
        >
          {needsExtraInfo ? "Sign in" : "Log in with Google"}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
