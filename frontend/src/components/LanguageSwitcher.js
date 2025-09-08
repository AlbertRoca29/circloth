import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GlobeIcon, ChevronDownIcon } from "../utils/svg";
import changeLanguage from "../utils/changeLanguage";

function LanguageSwitcher({ position = "fixed", top = 22, right = 22, zIndex = 1000, dropdownStyle = {}, buttonStyle = {}, displayFullLanguageName = false, appUser = null }) {
  const { i18n } = useTranslation();
  const [langDropdown, setLangDropdown] = useState(false);
  const langRef = useRef();
  const languages = [
    { code: "ca", label: "CA", fullName: "Català" },
    { code: "es", label: "ES", fullName: "Español" },
    { code: "en", label: "EN", fullName: "English" },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangDropdown(false);
      }
    }
    if (langDropdown) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langDropdown]);

  return (
    <div
      ref={langRef}
      style={{
        position,
        top,
        right,
        zIndex,
        userSelect: "none",
        fontWeight: 100,
        fontSize: "0.9em",
        fontFamily: "Geist, Segoe UI, Arial",
        ...buttonStyle,
      }}
    >
      <div
        onClick={() => setLangDropdown((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5em",
          background: "rgba(255,255,255,0.85)",
          borderRadius: "8px",
          padding: "0.45em",
          border: "1.2px solid #e6faed",
          cursor: "pointer",
          color: "#15803d",
          minWidth: 0,
          transition: "box-shadow 0.18s, border 0.18s",
        }}
      >
        <GlobeIcon />
        <span style={{ minWidth: 22, textAlign: "center" }}>
          {displayFullLanguageName
            ? languages.find((l) => l.code === i18n.language?.slice(0, 2))?.fullName || "Català"
            : languages.find((l) => l.code === i18n.language?.slice(0, 2))?.label || "CA"}
        </span>
        <ChevronDownIcon style={{ transform: "scale(1.3)" }} />
      </div>
      {langDropdown && (
        <div
          style={{
            position: "absolute",
            right: 0,
            background: "#fff",
            border: "1.2px solid #e6faed",
            borderRadius: "8px",
            boxShadow: "0 4px 16px #22c55e22",
            minWidth: "100px",
            padding: "0.3em 0.2em",
            marginTop: "0.2em",
            zIndex: 1001,
            ...dropdownStyle,
          }}
        >
          {languages.map((l) => (
            <div
              key={l.code}
              onClick={() => {
                changeLanguage(l.code, appUser);
                setLangDropdown(false);
              }}
              style={{
                padding: "0.45em",
                borderRadius: "8px",
                color: i18n.language?.slice(0, 2) === l.code ? "#cbcbcbff" : "#222",
                background: "transparent",
                cursor: "pointer",
                marginBottom: "0.1em",
                transition: "background 0.13s",
              }}
            >
              {displayFullLanguageName ? l.fullName : l.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
