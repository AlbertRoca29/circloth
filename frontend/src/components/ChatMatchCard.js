import React from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "../utils/general";

function ChatMatchCard({ match, onChat, isUnread, onViewProfile }) {
  const { t } = useTranslation();

  return (
    <div
      className="chat-match-card"
      style={{
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 2px 14px rgba(0,0,0,0.09)",
        padding: 16,
        marginBottom: 26,
        width: 340,
        minHeight: 100,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
        gap: 18,
      }}
    >
      {isUnread && (
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 14,
            height: 14,
            background: "red",
            borderRadius: "50%",
            zIndex: 2,
            border: "4px solid #fff",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          width: 88,
          height: 88 + (match.theirItems.length - 1) * 9,
          marginRight: (match.theirItems.length - 1) * 16,
        }}
      >
        {match.theirItems.map((item, i) => (
          <img
            key={item.id || i}
            src={item.photoURLs?.[0]}
            alt={`Their item ${i + 1}`}
            loading="lazy"
            onClick={() => onViewProfile(match.otherUser, false)}
            style={{
              width: 88,
              height: 88,
              borderRadius: 16,
              objectFit: "cover",
              border: "2.5px solid #e0e0e0",
              position: "absolute",
              left: i * 15,
              top: i * 7.5,
              zIndex: match.theirItems.length - i,
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 6,
        }}
      >
        <div
          style={{
            fontWeight: 200,
            fontSize: 17,
            color: "#15803d",
          }}
        >
          {match.otherUser.name || match.otherUser.displayName}
        </div>
        <div
          style={{
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          {getCategoryEmoji(match.theirItem?.category)}
        </div>
        <div
          style={{
            position: "relative",
            marginLeft: -20 + (6 - match.theirItems.length) * 20,
            width: 38 + (match.yourItems.length - 1) * 10,
            height: 38,
          }}
        >
          {Array.isArray(match.yourItems) && match.yourItems.length > 0
            ? match.yourItems.map((item, idx) => (
                <img
                  key={item.id || idx}
                  src={item.photoURLs?.[0]}
                  alt={`Your item ${idx + 1}`}
                  loading="lazy"
                  onClick={() => onViewProfile(match.otherUser, true)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    objectFit: "cover",
                    border: "1px solid #e0e0e0",
                    position: "absolute",
                    left: idx * 15,
                    zIndex: match.yourItems.length - idx,
                    cursor: "pointer",
                  }}
                />
              ))
            : null}
        </div>
      </div>
      <button
        onClick={() => onChat(match)}
        style={{
          background: "#22c55e",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          width: "80px",
          padding: "7px 12px",
          cursor: "pointer",
          height: "33px",
          position: "absolute",
          right: 16,
          bottom: 16,
        }}
      >
        {t("chat")}
      </button>
      <button
        onClick={() => onViewProfile(match.otherUser)}
        style={{
          background: "#f3f3f3",
          color: "#444",
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          width: "80px",
          padding: "7px 12px",
          cursor: "pointer",
          marginBottom: 27,
        }}
      >
        {t("view_profile")}
      </button>
    </div>
  );
}

export default ChatMatchCard;
