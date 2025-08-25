import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { auth, provider } from "../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import "../styles/Common.css";
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ width: "clamp(15rem, 20vw, 55rem)", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "1.5rem", position: "relative" }}>
        {/* Language Switcher at top right */}
        <div style={{ position: "absolute", top: 18, right: 18 }}>
          <LanguageSwitcher />
        </div>

        <h2 style={{ color: "var(--primary-dark, #15803d)", fontWeight: 250, textAlign: "center", fontSize: "1.6rem", marginBottom: "1.1rem", letterSpacing: "-0.02em", fontFamily: 'Geist' }}>{t("welcome")}</h2>

        {/* App intro section */}
        <div
          style={{
            background: "rgba(255,255,255,0.82)",
            borderRadius: "1.1rem",
            boxShadow: "0 2px 16px rgba(34,197,94,0.08)",
            padding: "1.1rem 1.2rem 1.1rem 1.2rem",
            marginBottom: "1.7rem",
            maxWidth: "34rem",
            fontFamily: 'Geist',
            whiteSpace: "pre-line",
            fontWeight: 100,
            fontSize: "0.75rem",
            color: "#222",
            textAlign: "center",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            border: "1.5px solid var(--primary-light)",
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
              className="input"
              type="text"
              placeholder={t("enter_name", "Enter your name")}
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              style={{ marginBottom: "1.2rem", width: "80%", fontSize: "1rem" }}
            />
            <label className="label" style={{ marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: 3 }}>
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={e => setPrivacyChecked(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              <p style={{ fontSize: "0.9rem" }}>{t("agree_privacy", "I agree to the ")}<a href="/PrivacyPolicy.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary, #22c55e)", textDecoration: "underline" }}>{t("privacy_policy", "Privacy Policy")}</a></p>
            </label>
          </>
        )}

        <button
          className="btn"
          onClick={needsExtraInfo ? handleSignIn : handleGoogleClick}
          disabled={needsExtraInfo && (!localName.trim() || !privacyChecked)}
        >
          {needsExtraInfo ? t("sign_in", "Sign in") : t("login_with_google", "Log in with Google")}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
