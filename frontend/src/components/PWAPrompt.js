import React from "react";

const pwaPromptStyle = {
  position: "fixed",
  bottom: 20,
  left: 0,
  right: 0,
  margin: "0 auto",
  maxWidth: 340,
  background: "#fff",
  border: "1px solid #15803d",
  borderRadius: 12,
  boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
  padding: 18,
  zIndex: 9999,
  textAlign: "center",
  color: "#15803d",
  fontFamily: "Inter, Segoe UI, Arial, sans-serif"
};

export default function PWAPrompt({ onInstall, onClose }) {
  return (
    <div style={pwaPromptStyle}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
        Install Circloth as an app
      </div>
      <div style={{ fontSize: 15, marginBottom: 14 }}>
        For a better experience, add Circloth to your home screen.
      </div>
      <button
        style={{
          background: "#15803d",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 18px",
          fontWeight: 600,
          marginRight: 10,
          cursor: "pointer"
        }}
        onClick={onInstall}
      >
        Install
      </button>
      <button
        style={{
          background: "#eee",
          color: "#15803d",
          border: "none",
          borderRadius: 6,
          padding: "8px 18px",
          fontWeight: 600,
          cursor: "pointer"
        }}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
