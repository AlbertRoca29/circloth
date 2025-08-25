

import React from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "../utils/general";

function ChatMatchCard({ match, onShowDetails, onChat, isUnread }) {
  const { t } = useTranslation();
  // Special case: 1 of your item, 2 of their items, same otherUser
  if (match.theirItems && match.theirItems.length === 2) {
    return (
      <div
        className="chat-match-card special"
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 2px 14px rgba(0,0,0,0.09)',
          padding: 16,
          marginBottom: 26,
          width: 340,
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          position: 'relative',
        }}
      >
        <div style={{ fontWeight: 200, fontSize: 17, color: '#15803d', marginBottom: 18, marginLeft: 10 }}>
          {match.otherUser.name || match.otherUser.displayName}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', width: '100%', marginBottom: 0, marginLeft: 10, position: 'relative' }}>
          {/* Images and show more buttons in a column */}
          {match.theirItems.map((item, i) => (
            <div key={item.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: i === 0 ? 18 : 0 }}>
              <img
                src={item.photoURLs?.[0]}
                alt={`Their item ${i + 1}`}
                loading="lazy"
                style={{ width: 88, height: 88, borderRadius: 18, objectFit: 'cover', border: '2.5px solid #e0e0e0', background: '#f6f6f6', marginBottom: 6 }}
              />
              <button
                onClick={() => onShowDetails({ item, otherUser: match.otherUser })}
                className="show-more-btn"
                style={{ background: '#f3f3f3', color: '#444', border: 'none', borderRadius: 10, fontSize: 14, width: '80px', padding: '7px 12px', cursor: 'pointer', marginTop: 4 }}
              >{t('show_more')}</button>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 50, width: '20px' }}>
            <span style={{ fontSize: 13, color: '#aaa' }}>{t('your_item')}:</span>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 6 }}>
              {Array.isArray(match.yourItems) && match.yourItems.length > 0 ? (
                match.yourItems.map((item, idx) => (
                  <img
                    key={item.id || idx}
                    src={item.photoURLs?.[0]}
                    alt={`Your item ${idx + 1}`}
                    loading="lazy"
                    style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', border: '1.5px solid #e0e0e0', marginRight: 4,marginBottom:65 }}
                  />
                ))
              ) : null}
            </div>
          </div>
        </div>
        {/* Chat button absolutely at bottom right */}
        <button
          onClick={() => onChat({
            otherUser: match.otherUser,
            theirItems: match.theirItems,
            yourItems: match.yourItems,
            matchIds: match.matchIds,
          })}
          className="chat-bottom-btn"
          style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, width: '80px', padding: '7px 12px', cursor: 'pointer', height: '33px', position: 'absolute', right: 16, bottom: 16 }}
        >{t('chat')}</button>
      </div>
    );
  }

  // Default: fallback to original card (legacy)
  return (
    <div className="chat-match-card" style={{
      display: "flex",
      alignItems: "center",
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 14px rgba(0,0,0,0.09)",
      padding: 16,
      marginBottom: 18,
      gap: 18,
      position: "relative",
      width: 340,
      minHeight: 100
    }}>
      {/* Red dot for unread */}
      {isUnread && (
        <span style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 14,
          height: 14,
          background: 'red',
          borderRadius: '50%',
          zIndex: 2,
          border: '4px solid #fff',
        }} />
      )}
      {/* Their item image */}
      <img
        src={match.theirItem?.photoURLs?.[0]}
        alt="Their item"
        loading="lazy"
        style={{ width: 88, height: 88, borderRadius: 16, objectFit: "cover", border: "2.5px solid #e0e0e0", cursor: "pointer" }}
        onClick={() => onShowDetails({ item: match.theirItem, otherUser: match.otherUser })}
      />
      {/* Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontWeight: 200, fontSize: 17, color: "#15803d", marginBottom: 2 }}>{match.otherUser.name || match.otherUser.displayName}</div>
        <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>{getCategoryEmoji(match.theirItem?.category)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <span style={{ fontSize: 13, color: "#aaa" }}>{Array.isArray(match.yourItems) && match.yourItems.length > 1 ? t('your_items') : t('your_item')}:</span>
          {/* Show all your item images if multiple, fallback to single */}
          {Array.isArray(match.yourItems) && match.yourItems.length > 0 ? (
            match.yourItems.map((item, idx) => (
              <img
                key={item.id || idx}
                src={item.photoURLs?.[0]}
                alt={`Your item ${idx + 1}`}
                loading="lazy"
                style={{ width: 38, height: 38, borderRadius: 9, objectFit: "cover", border: "1px solid #e0e0e0" }}
              />
            ))
          ) : match.yourItem ? (
            <img
              src={match.yourItem.photoURLs?.[0]}
              alt="Your item"
              loading="lazy"
              style={{ width: 38, height: 38, borderRadius: 9, objectFit: "cover", border: "1px solid #e0e0e0" }}
            />
          ) : null}
        </div>
      </div>
      {/* Show more button absolutely at top right */}
      <button
        onClick={() => onShowDetails({ item: match.theirItem, otherUser: match.otherUser })}
        className="show-more-btn"
        style={{ background: '#f3f3f3', color: '#444', border: 'none', borderRadius: 10, fontSize: 14, width: '80px', padding: '7px 12px', cursor: 'pointer', position: 'absolute', right: 16, top: 16 }}
      >
        {t('show_more')}
      </button>
      {/* Chat button absolutely at bottom right */}
      <button
        onClick={() => onChat(match)}
        className="chat-bottom-btn"
        style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, width: '80px', padding: '7px 12px', cursor: 'pointer', height: '33px', position: 'absolute', right: 16, bottom: 16 }}
      >
        {t('chat')}
      </button>
    </div>
  );
}

export default ChatMatchCard;
