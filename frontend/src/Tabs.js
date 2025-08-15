import React from "react";
import "./Common.css";

function Tabs({ activeTab, setActiveTab, hasClothes }) {
  return (
    <div style={{ width: "100%", margin: "2rem 0 2.5rem 0", background: "transparent", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
      <button
        className="tab-btn"
        style={{
          background: activeTab === "clothes" ? "var(--primary, #22c55e)" : "none",
          color: activeTab === "clothes" ? "#fff" : "var(--primary-dark, #15803d)",
          fontWeight: activeTab === "clothes" ? 700 : 500,
          border: "none",
          borderRadius: 8,
          padding: "0.7rem 1.2rem",
          fontSize: "1.08rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: activeTab === "clothes" ? "0 4px 16px rgba(34,197,94,0.13)" : "none",
          cursor: "pointer",
          transition: "background 0.18s, color 0.18s, box-shadow 0.18s"
        }}
        onClick={() => setActiveTab("clothes")}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        My clothes
      </button>
      <button
        className="tab-btn"
        style={{
          background: activeTab === "matching" ? "var(--primary, #22c55e)" : "none",
          color: !hasClothes ? "#94a3b8" : (activeTab === "matching" ? "#fff" : "var(--primary-dark, #15803d)"),
          fontWeight: activeTab === "matching" ? 700 : 500,
          border: "none",
          borderRadius: 8,
          padding: "0.7rem 1.2rem",
          fontSize: "1.08rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: activeTab === "matching" ? "0 4px 16px rgba(34,197,94,0.13)" : "none",
          cursor: !hasClothes ? "not-allowed" : "pointer",
          opacity: !hasClothes ? 0.6 : 1,
          transition: "background 0.18s, color 0.18s, box-shadow 0.18s"
        }}
        onClick={() => hasClothes && setActiveTab("matching")}
        disabled={!hasClothes}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.5.5-.5-.5a5.5 5.5 0 0 0-7.8 7.8l.5.5L12 21.3l7.3-7.3.5-.5a5.5 5.5 0 0 0 0-7.8z"/></svg>
        Matching
      </button>
      <button
        className="tab-btn"
        style={{
          background: activeTab === "chats" ? "var(--primary, #22c55e)" : "none",
          color: activeTab === "chats" ? "#fff" : "var(--primary-dark, #15803d)",
          fontWeight: activeTab === "chats" ? 700 : 500,
          border: "none",
          borderRadius: 8,
          padding: "0.7rem 1.2rem",
          fontSize: "1.08rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: activeTab === "chats" ? "0 4px 16px rgba(34,197,94,0.13)" : "none",
          cursor: "pointer",
          transition: "background 0.18s, color 0.18s, box-shadow 0.18s"
        }}
        onClick={() => setActiveTab("chats")}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Chats
      </button>
      </div>
    </div>
  );
}

export default Tabs;
