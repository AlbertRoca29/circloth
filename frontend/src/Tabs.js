import React, { useRef } from "react";
import "./Common.css";

function Tabs({ activeTab, setActiveTab, hasClothes }) {
  const messageRef = useRef(null);

  const handleMatchingClick = () => {
    if (!hasClothes) {
      if (messageRef.current) {
        messageRef.current.textContent =
          "You have to upload at least one item to access Matching.";
        messageRef.current.style.opacity = 1;
        setTimeout(() => {
          if (messageRef.current) messageRef.current.style.opacity = 0;
        }, 2500);
      }
      return;
    }
    setActiveTab("matching");
  };

  const TabButton = ({ tab, label, icon, onClick, disabled }) => (
    <button
      className={`tab-btn${tab === activeTab ? ' tab-btn-active' : ''}`}
      style={{
        flex: 1,
        background: "none",
        border: "none",
        outline: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color:
          tab === activeTab
            ? "#fff"
            : disabled
            ? "#94a3b8"
            : "var(--primary-dark, #15803d)",
        borderRadius: 10,
        padding: "4px 0 2px 0",
        fontSize: "0.68rem",
        fontWeight: tab === activeTab ? 150 : 100,
        transition: "all 0.22s",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        background:
          tab === activeTab ? "var(--primary, #22c55e)" : "transparent",
        minWidth: 0,
        fontFamily: "'Geist', 'Geist Sans', 'Segoe UI', Arial, sans-serif",
        letterSpacing: tab === activeTab ? "0.01em" : "0.02em"
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
        {icon}
      </div>
      {label}
    </button>
  );

  return (
    <>
      {/* Floating bottom navigation bar */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 16,
          transform: "translateX(-50%)",
          width: "220px",
          maxWidth: 440,
          height: 64,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderRadius: 20,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          zIndex: 200,
          padding: "0 8px"
        }}
      >
        <TabButton
          tab="clothes"
          label="Clothes"
          onClick={() => setActiveTab("clothes")}
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />
        <TabButton
          tab="matching"
          label="Matching"
          onClick={handleMatchingClick}
          disabled={!hasClothes}
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.5.5-.5-.5a5.5 5.5 0 0 0-7.8 7.8l.5.5L12 21.3l7.3-7.3.5-.5a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          }
        />
        <TabButton
          tab="chats"
          label="Chats"
          onClick={() => setActiveTab("chats")}
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
      </div>

      {/* Message feedback */}
      <div
        ref={messageRef}
        style={{
          textAlign: "center",
          color: "#e11d48",
          fontWeight: 150,
          fontSize: "1rem",
          marginTop: 10,
          minHeight: 22,
          opacity: 0,
          transition: "opacity 0.3s",
        }}
      ></div>
    </>
  );
}

export default Tabs;
