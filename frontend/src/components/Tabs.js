import React, { useRef } from "react";
import { UserIcon, HeartIcon, ChatIcon } from '../utils/svg';
import { useTranslation } from "react-i18next";

function Tabs({ activeTab, setActiveTab, hasClothes=true, hasUnreadChats }) {
  const { t } = useTranslation();
  const messageRef = useRef(null);


  const TabButton = ({ tab, label, icon, onClick, disabled }) => (
    <button
      style={{
        position: "relative",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: tab === activeTab ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "transparent",
        color: tab === activeTab ? "#fff" : disabled ? "#94a3b8" : "var(--primary-dark, #15803d)",
        border: "none",
        borderRadius: "12px",
        padding: "0.4rem 1rem",
        fontSize: "0.85rem",
        fontWeight: tab === activeTab ? 150 : 100,
        fontFamily: "Geist, Geist Sans, Segoe UI, Arial, sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.18s, color 0.18s",
        borderBottom: tab === activeTab ? "4px solid var(--accent, #bbf7d0)" : "4px solid transparent",
        letterSpacing: tab === activeTab ? "0.01em" : "0.02em",
        boxShadow: tab === activeTab ? "0 4px 16px rgba(34, 197, 94, 0.13)" : "none",
        opacity: disabled ? 0.6 : 1,
        minWidth: 0,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
        {icon}
      </div>
      {t(label)}
    </button>
  );

  return (
    <>
      {/* Floating bottom navigation bar */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 2,
          transform: "translateX(-50%)",
          width: "260px",
          height: 68,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderRadius: 20,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          zIndex: 200,
          padding: "0 8px",
          gap: 4,
        }}
      >
        <TabButton
          tab="clothes"
          label="tab_clothes"
          onClick={() => setActiveTab("clothes")}
          icon={<UserIcon />}
        />
        <TabButton
          tab="matching"
          label="tab_matching"
          onClick={() => setActiveTab("matching")}
          icon={<HeartIcon />}
        />
        <TabButton
          tab="chats"
          label="tab_chats"
          onClick={() => setActiveTab("chats")}
          icon={
            <span style={{ position: "relative", display: "inline-block" }}>
              <ChatIcon />
              {hasUnreadChats && (
                <span style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  background: "#e11d48",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  zIndex: 2,
                  boxShadow: "0 0 2px #e11d48"
                }} />
              )}
            </span>
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
