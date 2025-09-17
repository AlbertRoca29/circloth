import React, { useRef } from "react";
import { UserIcon, HeartIcon, ChatIcon } from '../utils/svg';
import { useTranslation } from "react-i18next";

function Tabs({ activeTab, setActiveTab, hasClothes=true, hasUnreadChats }) {
  const { t } = useTranslation();
  const messageRef = useRef(null);


  const TabButton = ({ tab, label, icon, onClick }) => (
    <button
      style={{
        position: "relative",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: tab === activeTab ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "transparent",
        color: tab === activeTab ? "#fff" : "var(--primary-dark, #15803d)",
        border: "none",
        borderRadius: "12px",
        padding: "0.9rem 0.6rem",
        fontSize: "0.85rem",
        fontWeight: tab === activeTab ? 150 : 100,
        fontFamily: "Geist, Geist Sans, Segoe UI, Arial, sans-serif",
        cursor: "pointer",
        transition: "background 2.88s, color 2.88s",
        borderBottom: tab === activeTab ? "4px solid var(--accent, #bbf7d0)" : "4px solid transparent",
        letterSpacing: tab === activeTab ? "0.01em" : "0.02em",
        boxShadow: tab === activeTab ? "0 4px 1px rgba(34, 197, 94, 0)" : "none",
        minWidth: 0,
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 0 }}>
        {icon}
      </div>
      {/* {t(label)} */}
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
          width: "60%",
          height: 68,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderRadius: 20,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          zIndex: 200,
          padding: "0px 30%",
          gap: "2.5vw",
        }}
      >
        <TabButton
          tab="clothes"
          label="tab_clothes"
          onClick={() => setActiveTab("clothes")}
          icon={<UserIcon  size={27} />}
        />
        <TabButton
          tab="matching"
          label="tab_matching"
          onClick={() => setActiveTab("matching")}
          icon={<HeartIcon size={27} />}
        />
        <TabButton
          tab="chats"
          label="tab_chats"
          onClick={() => setActiveTab("chats")}
          icon={
            <span style={{ position: "relative", display: "inline-block" }}>
              <ChatIcon size={27}/>
              {hasUnreadChats && (
                <span style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  background: "#23e900ff",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  zIndex: 2,
                  boxShadow: "0 0 2px #2de11dff"
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
