import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { COLORS, FONT_FAMILY } from "../constants/theme";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    setOpen(false);
    // Save language to backend if user is logged in
    const user = JSON.parse(localStorage.getItem('appUser'));
    if (user && user.uid) {
      try {
        await fetch(`/user/${user.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lng })
        });
        // Optionally update local user
        user.language = lng;
        localStorage.setItem('appUser', JSON.stringify(user));
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <button
        title="Change language"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          outline: "none"
        }}
      >
        {/* Planet icon */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.appGreen} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <ellipse cx="12" cy="12" rx="4" ry="10" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 36,
            right: 0,
            background: COLORS.white,
            border: `1.5px solid ${COLORS.appGreen}`,
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(34,197,94,0.13)",
            padding: 10,
            zIndex: 100,
            minWidth: 120,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <button
            onClick={() => changeLanguage('ca')}
            style={{
              background: i18n.language === 'ca' ? COLORS.appGreen : '#f3f4f6',
              color: i18n.language === 'ca' ? COLORS.white : COLORS.appGreenDark,
              border: 'none',
              borderRadius: 6,
              padding: '7px 0',
              fontWeight: 200,
              fontSize: 15,
              fontFamily: FONT_FAMILY,
              cursor: 'pointer',
              transition: 'background 0.2s',
              marginBottom: 2
            }}
          >CA</button>
          <button
            onClick={() => changeLanguage('es')}
            style={{
              background: i18n.language === 'es' ? COLORS.appGreen : '#f3f4f6',
              color: i18n.language === 'es' ? COLORS.white : COLORS.appGreenDark,
              border: 'none',
              borderRadius: 6,
              padding: '7px 0',
              fontWeight: 200,
              fontSize: 15,
              fontFamily: FONT_FAMILY,
              cursor: 'pointer',
              transition: 'background 0.2s',
              marginBottom: 2
            }}
          >ES</button>
          <button
            onClick={() => changeLanguage('en')}
            style={{
              background: i18n.language === 'en' ? COLORS.appGreen : '#f3f4f6',
              color: i18n.language === 'en' ? COLORS.white : COLORS.appGreenDark,
              border: 'none',
              borderRadius: 6,
              padding: '7px 0',
              fontWeight: 200,
              fontSize: 15,
              fontFamily: FONT_FAMILY,
              cursor: 'pointer',
              transition: 'background 0.2s',
              marginBottom: 2
            }}
          >EN</button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
