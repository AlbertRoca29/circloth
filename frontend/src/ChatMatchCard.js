

import React from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "./utils/general";

function ChatMatchCard({ match, onShowDetails, onChat }) {
  const { t } = useTranslation();
  // Special case: 1 of your item, 2 of their items, same otherUser
  if (match.theirItems && match.theirItems.length === 2) {
    return (
      <div
        className="chat-match-card special"
        style={{
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 2px 14px rgba(0,0,0,0.09)',
          padding: 32,
          marginBottom: 36,
          minWidth: 480,
          maxWidth: 700,
          minHeight: 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          position: 'relative',
        }}
      >
        <div style={{ fontWeight: 200, fontSize: 18, color: '#15803d', marginBottom: 18, marginLeft: 10 }}>
          {match.otherUser.name || match.otherUser.displayName}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', width: '100%', marginBottom: 12, marginLeft: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 18 }}>
            {match.theirItems.map((item, i) => (
              <img
                key={item.id || i}
                src={item.photoURLs?.[0]}
                alt={`Their item ${i + 1}`}
                loading="lazy"
                style={{ width: 110, height: 110, borderRadius: 18, objectFit: 'cover', border: '2.5px solid #e0e0e0', background: '#f6f6f6' }}
              />
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 10 }}>
            <span style={{ fontSize: 15, color: '#aaa', marginBottom: 6 }}>{t('your_items')}:</span>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
              {Array.isArray(match.yourItems) && match.yourItems.length > 0 ? (
                match.yourItems.map((item, idx) => (
                  <img
                    key={item.id || idx}
                    src={item.photoURLs?.[0]}
                    alt={`Your item ${idx + 1}`}
                    loading="lazy"
                    style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #e0e0e0', marginRight: 4 }}
                  />
                ))
              ) : null}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, marginLeft: 10 }}>
          <button
            onClick={() => onShowDetails({ item: match.theirItems[0], otherUser: match.otherUser })}
            style={{ background: '#f3f3f3', color: '#444', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 15, cursor: 'pointer' }}
          >{t('show_more_1')}</button>
          <button
            onClick={() => onShowDetails({ item: match.theirItems[1], otherUser: match.otherUser })}
            style={{ background: '#f3f3f3', color: '#444', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 15, cursor: 'pointer' }}
          >{t('show_more_2')}</button>
          <button
            onClick={() => onChat({
              otherUser: match.otherUser,
              theirItems: match.theirItems,
              yourItems: match.yourItems,
              matchIds: match.matchIds,
            })}
            style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 16, cursor: 'pointer' }}
          >{t('chat')}</button>
        </div>
      </div>
    );
  }

  // Default: fallback to original card (legacy)
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
        src={match.theirItem?.photoURLs?.[0]}
        alt="Their item"
        loading="lazy"
        style={{ width: 88, height: 88, borderRadius: 16, objectFit: "cover", border: "2.5px solid #e0e0e0", cursor: "pointer" }}
        onClick={() => onShowDetails({ item: match.theirItem, otherUser: match.otherUser })}
      />
      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 200, fontSize: 21, color: "#15803d", marginBottom: 2 }}>{match.otherUser.name || match.otherUser.displayName}</div>
        <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>{getCategoryEmoji(match.theirItem?.category)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#aaa" }}>{Array.isArray(match.yourItems) && match.yourItems.length > 1 ? t('your_items') : t('your_item')}:</span>
          {/* Show all your item images if multiple, fallback to single */}
          {Array.isArray(match.yourItems) && match.yourItems.length > 0 ? (
            match.yourItems.map((item, idx) => (
              <img
                key={item.id || idx}
                src={item.photoURLs?.[0]}
                alt={`Your item ${idx + 1}`}
                loading="lazy"
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1.5px solid #e0e0e0" }}
              />
            ))
          ) : match.yourItem ? (
            <img
              src={match.yourItem.photoURLs?.[0]}
              alt="Your item"
              loading="lazy"
              style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1.5px solid #e0e0e0" }}
            />
          ) : null}
        </div>
      </div>
      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={() => onShowDetails({ item: match.theirItem, otherUser: match.otherUser })}
          style={{ background: "#f3f3f3", color: "#444", border: "none", borderRadius: 10, padding: "7px 16px", fontSize: 16, cursor: "pointer" }}
        >
          {t('show_more')}
        </button>
        <button
          onClick={() => onChat(match)}
          style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: "7px 16px", fontSize: 16, cursor: "pointer" }}
        >
          {t('chat')}
        </button>
      </div>
    </div>
  );
}

export default ChatMatchCard;
