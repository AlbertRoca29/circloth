import React, { useState } from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup } from "firebase/auth";
import "./Common.css";
import BACKEND_URL from "./config";


function LoginPage({ firebaseUser, setAppUser }) {
  const [localName, setLocalName] = useState("");
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [needsExtraInfo, setNeedsExtraInfo] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  // Debug state
  const [debugOpen, setDebugOpen] = useState(true);
  const [lastError, setLastError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  const handleGoogleClick = async () => {
    setLastError(null);
    setLastResponse(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Try to fetch user profile from backend
      const res = await fetch(`${BACKEND_URL}/user/${user.uid}`);
      setLastResponse({
        url: `${BACKEND_URL}/user/${user.uid}`,
        status: res.status,
        ok: res.ok,
      });
      if (res.ok) {
        const data = await res.json();
        setAppUser({ ...user, ...data });
      } else {
        // New user → ask extra info
        setPendingUser(user);
        setNeedsExtraInfo(true);
      }
    } catch (err) {
      setLastError({ type: "google", error: err?.message || err });
      console.error("Google sign-in failed:", err);
    }
  };

  const handleSignIn = async () => {
    if (!localName.trim() || !privacyChecked || !pendingUser) return;
    setLastError(null);
    setLastResponse(null);
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
      setLastResponse({
        url: `${BACKEND_URL}/user/${pendingUser.uid}`,
        status: res.status,
        ok: res.ok,
      });
      if (res.ok) {
        setAppUser({ ...pendingUser, name: localName });
        setPendingUser(null);
        setNeedsExtraInfo(false);
        setLocalName("");
        setPrivacyChecked(false);
      } else {
        throw new Error("Failed to create user profile");
      }
    } catch (err) {
      setLastError({ type: "signIn", error: err?.message || err });
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

        {/* Debug Panel */}
        <div style={{ width: "100%", marginTop: 24, background: "#f6f6f6", borderRadius: 8, fontSize: 13, color: "#222", padding: 8, boxSizing: "border-box" }}>
          <button
            style={{ fontSize: 12, background: "#e0e0e0", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", marginBottom: 6 }}
            onClick={() => setDebugOpen(v => !v)}
          >
            {debugOpen ? "Hide Debug" : "Show Debug"}
          </button>
          {debugOpen && (
            <div style={{ maxHeight: 300, overflow: "auto", textAlign: "left" }}>
              <div><b>firebaseUser:</b> <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(firebaseUser, null, 2)}</pre></div>
              <div><b>pendingUser:</b> <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(pendingUser, null, 2)}</pre></div>
              <div><b>localName:</b> {localName}</div>
              <div><b>privacyChecked:</b> {String(privacyChecked)}</div>
              <div><b>needsExtraInfo:</b> {String(needsExtraInfo)}</div>
              <div><b>lastResponse:</b> <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(lastResponse, null, 2)}</pre></div>
              <div><b>lastError:</b> <pre style={{ color: "#b00", whiteSpace: "pre-wrap" }}>{JSON.stringify(lastError, null, 2)}</pre></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
