import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { auth, provider } from "../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import BACKEND_URL from "../config";

function LoginPage({ firebaseUser, setAppUser }) {
  const { t } = useTranslation();
  const [localName, setLocalName] = useState("");
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [needsExtraInfo, setNeedsExtraInfo] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const handleGoogleClick = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Try to fetch user profile from backend
      const res = await fetch(`${BACKEND_URL}/user/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setAppUser({ ...user, ...data });
        // Save user to localStorage for language persistence
        localStorage.setItem('appUser', JSON.stringify({ ...user, ...data }));
      } else {
        // New user → ask extra info
        setPendingUser(user);
        setNeedsExtraInfo(true);
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
      const language = window.i18next?.language || 'ca';
      const res = await fetch(`${BACKEND_URL}/user/${pendingUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pendingUser.uid,
          name: localName,
          email: pendingUser.email,
          passed_items: [],
          device_info: deviceInfo,
          language
        })
      });
      if (res.ok) {
        setAppUser({ ...pendingUser, name: localName, language });
        localStorage.setItem('appUser', JSON.stringify({ ...pendingUser, name: localName, language }));
        setPendingUser(null);
        setNeedsExtraInfo(false);
        setLocalName("");
        setPrivacyChecked(false);
      } else {
        throw new Error("Failed to create user profile");
      }
    } catch (err) {
      console.error("Sign-in failed:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(120deg, #e6faed 0%, #f3f4f6 100%)" }}>
      <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: "18px", boxShadow: "0 8px 32px rgba(34, 197, 94, 0.13)", padding: "2.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "320px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid #e6faed" }}>
        {/* Language Switcher at top right */}
        <div style={{ position: "absolute", top: 18, right: 18 }}>
          <LanguageSwitcher />
        </div>

        <h2 style={{ marginBottom: "1.5rem", color: "#15803d", fontWeight: 200, fontSize: "2rem", letterSpacing: "0.5px", fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t("welcome")}</h2>

        {/* App intro section */}
        <div
          style={{
            background: "rgba(255,255,255,0.82)",
            borderRadius: "1.1rem",
            boxShadow: "0 2px 16px rgba(34,197,94,0.08)",
            padding: "1.1rem 1.2rem 1.1rem 1.2rem",
            marginBottom: "1.7rem",
            maxWidth: "320px",
            fontFamily: 'Geist',
            whiteSpace: "pre-line",
            fontWeight: 100,
            fontSize: "0.75rem",
            color: "#222",
            textAlign: "center",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            border: "1.5px solid #e6faed",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            transition: "box-shadow 0.18s"
          }}
        >
          {t("login_intro")}
        </div>

        {needsExtraInfo && (
          <>
            <input
              type="text"
              placeholder={t("enter_name", "Enter your name")}
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              style={{ fontWeight: 100, width: "100%", padding: "0.85rem 1.1rem", border: "1.5px solid #e6faed", marginBottom: "1.2rem", fontSize: "1.08rem", fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif', outline: "none", transition: "border 0.18s, box-shadow 0.18s", background: "#f9fafb", boxShadow: "0 1px 4px rgba(34, 197, 94, 0.04)" }}
            />
            <label style={{ fontSize: "0.98rem", color: "#334155", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={e => setPrivacyChecked(e.target.checked)}
                style={{ marginRight: "6px" }}
              />
              <p style={{ fontSize: "0.9rem" }}>{t("agree_privacy", "I agree to the ")}<a href="/PrivacyPolicy.html" target="_blank" rel="noopener noreferrer" style={{ color: "#22c55e", textDecoration: "underline" }}>{t("privacy_policy", "Privacy Policy")}</a></p>
            </label>
          </>
        )}

        <button
          onClick={needsExtraInfo ? handleSignIn : handleGoogleClick}
          disabled={needsExtraInfo && (!localName.trim() || !privacyChecked)}
          style={{ background: needsExtraInfo && (!localName.trim() || !privacyChecked) ? "#e5e7eb" : "linear-gradient(135deg, #22c55e, #15803d)", color: needsExtraInfo && (!localName.trim() || !privacyChecked) ? "#64748b" : "#fff", border: "none", borderRadius: "999px", padding: "0.9rem 2.2rem", fontSize: "1.15rem", fontWeight: 700, cursor: needsExtraInfo && (!localName.trim() || !privacyChecked) ? "not-allowed" : "pointer", transition: "background 0.18s, box-shadow 0.18s, transform 0.12s", marginTop: "0.5rem", boxShadow: "0 4px 16px rgba(34, 197, 94, 0.13)", letterSpacing: "0.02em" }}
        >
          {needsExtraInfo ? t("sign_in", "Sign in") : t("login_with_google", "Log in with Google")}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
