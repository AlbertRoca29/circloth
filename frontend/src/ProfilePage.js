import React from "react";
import "./Common.css";


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
      background: "rgba(34,197,94,0.25)", // more opaque
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      zIndex: 3000,
      overflow: "hidden"
    }}>
      <div className="card" style={{
        minWidth: 320,
        maxWidth: 360,
        width: '100%',
        margin: '48px auto',
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 8px 32px rgba(34,197,94,0.13)",
        borderRadius: 18,
        padding: "2.2rem 1.5rem",
        maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto',
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: "2rem", color: "var(--primary-dark, #15803d)", cursor: "pointer", transition: "color 0.18s" }}>&times;</button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16, width: '100%' }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--primary-light, #e6faed)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 2px 8px rgba(34,197,94,0.08)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark, #15803d)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"/></svg>
          </div>
          <h2 style={{ margin: 0, color: "var(--primary-dark, #15803d)", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "0.01em", fontFamily: 'Inter, Segoe UI, Arial, sans-serif', textAlign: 'center' }}>Profile</h2>
        </div>
        <div style={{ fontSize: "1.1rem", color: "#222", display: "flex", flexDirection: "column", gap: "0.7rem", width: "100%" }}>
          <div><b>Name:</b> {user.name}</div>
          <div><b>Email:</b> {user.email}</div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
