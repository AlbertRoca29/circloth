import React from "react";


import { useEffect } from "react";

function ProfilePage({ user, onClose }) {
  // Disable scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(34, 197, 94, 0.10)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        fontWeight: 100,
        background: "rgba(255,255,255,0.7)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(34, 197, 94, 0.13)",
        padding: "2rem 2.5rem 1.5rem 2.5rem",
        minWidth: "320px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1.5px solid #e6faed",
        fontFamily: "Geist, Geist Sans, Segoe UI, Arial, sans-serif"
      }}>
        <button onClick={onClose} style={{
          position: "absolute",
          top: "12px",
          right: "16px",
          background: "none",
          border: "none",
          fontSize: "2rem",
          color: "#15803d",
          cursor: "pointer",
          transition: "color 0.18s"
        }}
        onMouseOver={(e) => e.target.style.color = "#22c55e"}
        onMouseOut={(e) => e.target.style.color = "#15803d"}>
          &times;
        </button>
        <div style={{
          fontWeight: 100,
          marginTop: "1.2rem",
          fontSize: "1.1rem",
          fontFamily: "Geist, Geist Sans, Segoe UI, Arial, sans-serif",
          color: "#222",
          display: "flex",
          flexDirection: "column",
          gap: "0.7rem"
        }}>
          <div><b>Name:</b> {user.name}</div>
          <div><b>Email:</b> {user.email}</div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
