import React from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "../utils/general";
import { height } from "@mui/system";

// Extracted common image rendering logic
function ItemImage({ item, alt, style, ...rest }) {
  return (
    <img
      key={item.id}
      src={item.photoURLs?.[0]}
      alt={alt}
      loading="lazy"
      style={style}
      {...rest}
    />
  );
}

function ItemGrid({ items, size = 85, borderRadius = 12, border = 0, fontSize = 28 }) {
  if (!items || items.length === 0) return null;

  // Common style for all images
  const baseStyle = {
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    borderRadius,
    objectFit: "cover",
    border,
    cursor: "pointer",
  };

  if (items.length === 1) {
    return (
      <ItemImage
        item={items[0]}
        alt={`item 1`}
        style={{
          ...baseStyle,
          gridColumn: '1 / span 2',
          gridRow: '1 / span 2',
        }}
      />
    );
  } else if (items.length === 2) {
    return items.map((item, i) => (
      <ItemImage
        key={item.id || i}
        item={item}
        alt={`item ${i + 1}`}
        style={{
          ...baseStyle,
          gridColumn: i === 0 ? '1' : '2',
          gridRow: '1 / span 2',
        }}
      />
    ));
  } else if (items.length === 3) {
    return (
      <>
        <ItemImage
          key={items[0].id || 0}
          item={items[0]}
          alt={`item 1`}
          style={{
            ...baseStyle,
            gridColumn: '1 / span 2',
            gridRow: '1',
          }}
        />
        <ItemImage
          key={items[1].id || 1}
          item={items[1]}
          alt={`item 2`}
          style={{
            ...baseStyle,
            gridColumn: '1',
            gridRow: '2',
          }}
        />
        <ItemImage
          key={items[2].id || 2}
          item={items[2]}
          alt={`item 3`}
          style={{
            ...baseStyle,
            gridColumn: '2',
            gridRow: '2',
          }}
        />
      </>
    );
  } else if (items.length === 4) {
    return items.slice(0, 4).map((item, i) => (
      <ItemImage
        key={item.id || i}
        item={item}
        alt={`item ${i + 1}`}
        style={baseStyle}
      />
    ));
  } else if (items.length > 4) {
    return [
      ...items.slice(0, 3).map((item, i) => (
        <ItemImage
          key={item.id || i}
          item={item}
          alt={`item ${i + 1}`}
          style={baseStyle}
        />
      )),
      <div
        key="plus"
        style={{
          ...baseStyle,
          background: 'rgba(0,0,0,0.35)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 700,
        }}
      >
        +{items.length - 3}
      </div>
    ];
  }
  return null;
}

function ChatMatchCard({ match, onChat, isUnread, onViewProfile, lastMessage, currentUserId }) {
  const { t } = useTranslation();

  // Helper: render last message or New match! Now also renders time if present
  function renderLastMessage() {
    if (lastMessage && lastMessage.content) {
      const isSent = lastMessage.sender === currentUserId;
      // Format time (assume lastMessage.timestamp is ISO string or ms)
      let timeStr = '';
      if (lastMessage.timestamp) {
        let dateObj = typeof lastMessage.timestamp === 'string' ? new Date(lastMessage.timestamp) : new Date(Number(lastMessage.timestamp));
        if (!isNaN(dateObj.getTime())) {
          timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      }
      return (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
          <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {isSent && (
              <svg width="12" height="12" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 4}}>
                <path d="M3.05 24.95L25 15.5C25.8333 15.1667 25.8333 13.8333 25 13.5L3.05 4.05C2.21667 3.71667 1.38333 4.55 1.71667 5.38333L4.95 13.5L1.71667 21.6167C1.38333 22.45 2.21667 23.2833 3.05 22.95Z" fill="#22c55e" />
              </svg>
            )}
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: "30vw" }}>{lastMessage.content}</span>
          </span>
          {timeStr && (
            <span style={{ color: '#888', fontSize: 12, fontWeight: 100, marginTop: 2, marginLeft: isSent ? 18 : 0, whiteSpace: 'nowrap' }}>{timeStr}</span>
          )}
        </span>
      );
    }
    // If there is a lastMessage object (even if only one), but no content, show nothing
    if (lastMessage && !lastMessage.content) {
      return null;
    }
    // Otherwise, show New match!
    return <span style={{ color: '#19b653ff', fontWeight: 175, marginLeft:'0.5vw' }}>{t('new_match', 'New match!')}</span>;
  }

  return (
    <div
      onClick={() => onChat(match)}
      className="chat-match-card"
      style={{
        cursor: "pointer",
        background: "#fff",
        borderRadius: 13,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        marginBottom: 0,
        height: "16vh",
        width: "89vw",
        display: "flex",
        alignItems: "center",
        position: "relative",
        transition: 'box-shadow 0.18s',
      }}
    >
      {isUnread && (
        <span
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: 12,
            height: 12,
            background: "#22c55e",
            borderRadius: "50%",
            zIndex: 2,
            border: "2.5px solid #fff",
            boxShadow: '0 0 0 2px #e5e5e5',
          }}
        />
      )}

      {/* Image grid (left part) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 0,
          height: "100%",
          aspectRatio: "1",
          marginRight: 13,
          borderRadius: 10,
          position: 'relative',
          overflow: 'hidden',
          alignItems: 'stretch',
          justifyItems: 'stretch',
        }}
      >
        <ItemGrid items={match.theirItems} size={85} borderRadius={0} border={0} fontSize={28} />
      </div>

      {/* Info column (right part) */}
      <div
        style={{
          marginTop: "4vh",
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          minWidth: 0,
          gap: 13,
          height: '100%',
          padding: '2vh 0vh 1.5vh 1.5vw', // more padding, no left padding to keep close to image
        }}
      >
        <div
          style={{
            fontWeight: 175,
            fontSize: '1.05rem',
            color: "#15803d",
            letterSpacing: 0.1,
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {match.otherUser.name || match.otherUser.displayName}
        </div>
        <div style={{ width: '95%', borderBottom: '1.5px solid #e5e5e5', margin: '0px 0 0px 0' }} />
        <div
          style={{
            lineHeight: 1.3,
            fontWeight: lastMessage && lastMessage.sender === currentUserId ? 100 : 150,
            fontSize: '0.9rem',
            color: "#555",
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            minHeight: 22,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {renderLastMessage()}
        </div>
      </div>
    </div>
  );
}

export default ChatMatchCard;
