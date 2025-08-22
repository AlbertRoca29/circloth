
import React from "react";
import { getCategoryEmoji } from "./utils/general";

function ChatMatchCard({ match, onShowDetails, onChat }) {
  // match: { id, otherUser, theirItem, yourItem }
  return (
    <div className="chat-match-card" style={{
      display: "flex",
      alignItems: "center",
      background: "#fff",
      borderRadius: 20,
      boxShadow: "0 2px 14px rgba(0,0,0,0.09)",
      padding: 22,
      marginBottom: 26,
      gap: 28,
      position: "relative",
      minWidth: 420,
      maxWidth: 650,
      minHeight: 110
    }}>
      {/* Their item image */}
      <img
        src={match.theirItem.photoURLs?.[0]}
        alt="Their item"
        style={{ width: 88, height: 88, borderRadius: 16, objectFit: "cover", border: "2.5px solid #e0e0e0", cursor: "pointer" }}
        onClick={() => onShowDetails(match)}
      />
      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 200, fontSize: 21, color: "#15803d", marginBottom: 2 }}>{match.otherUser.name || match.otherUser.displayName}</div>
  <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>{getCategoryEmoji(match.theirItem.category)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#aaa" }}>Your item:</span>
          <img
            src={match.yourItem.photoURLs?.[0]}
            alt="Your item"
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1.5px solid #e0e0e0" }}
          />
        </div>
      </div>
      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={() => onShowDetails(match)}
          style={{ background: "#f3f3f3", color: "#444", border: "none", borderRadius: 10, padding: "7px 16px", fontSize: 16, cursor: "pointer" }}
        >
          Show more
        </button>
        <button
          onClick={() => onChat(match)}
          style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: "7px 16px", fontSize: 16, cursor: "pointer" }}
        >
          Chat
        </button>
      </div>
    </div>
  );
}

export default ChatMatchCard;
