import React from "react";
import { useTranslation } from "react-i18next";

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
    boxSizing: 'border-box',
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
    // Add green border between the two images
    return items.map((item, i) => (
      <ItemImage
        key={item.id || i}
        item={item}
        alt={`item ${i + 1}`}
        style={{
          ...baseStyle,
          gridColumn: i === 0 ? '1' : '2',
          gridRow: '1 / span 2',
          borderRight: i === 0 ? '0px solid #ffffffff' : undefined,
        }}
      />
    ));
  } else if (items.length === 3) {
    // Top image spans two columns, bottom two images have green border between them
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
            borderBottom: '0px solid #22c55e',
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
            borderRight: '0px solid #22c55e',
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
    // 2x2 grid, add palette border between images
    return items.slice(0, 4).map((item, i) => {
      // 0 | 1
      // 2 | 3
      let style = { ...baseStyle };
      // Right border for left column
      if (i % 2 === 0) style.borderRight = '3px solid var(--primary)';
      // Bottom border for top row
      if (i < 2) style.borderBottom = '3px solid var(--primary)';
      return (
        <ItemImage
          key={item.id || i}
          item={item}
          alt={`item ${i + 1}`}
          style={style}
        />
      );
    });
  } else if (items.length > 4) {
    // 2x2 grid, last cell is "+N" overlay, add palette border between images
    return [
      ...items.slice(0, 3).map((item, i) => {
        // 0 | 1
        // 2 | +N
        let style = { ...baseStyle };
        // Right border for left column
        if (i % 2 === 0) style.borderRight = '3px solid var(--primary)';
        // Bottom border for top row
        if (i < 2) style.borderBottom = '3px solid var(--primary)';
        return (
          <ItemImage
            key={item.id || i}
            item={item}
            alt={`item ${i + 1}`}
            style={style}
          />
        );
      }),
      <div
        key="plus"
        style={{
          ...baseStyle,
          background: 'var(--glass-bg)',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 700,
          // Right border for left column
          borderRight: '3px solid var(--primary)',
          // Bottom border for top row
          borderBottom: '3px solid var(--primary)',
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

  // Count bubbles: big = their items, small = your items
  const theirItemsCount = match?.theirItems?.length || 0;
  const yourItemsCount = match?.yourItems?.length || 0;

  // Helper: render last message or New match! Now also renders time if present
  function renderLastMessage() {
    if (lastMessage && lastMessage.content) {
      const isSent = lastMessage.sender === currentUserId;
      // Format time (assume lastMessage.timestamp is ISO string or ms)
      let timeStr = '';
      if (lastMessage.timestamp) {
        let dateObj = typeof lastMessage.timestamp === 'string' ? new Date(lastMessage.timestamp) : new Date(Number(lastMessage.timestamp));
        if (!isNaN(dateObj.getTime())) {
          const now = new Date();
          const isToday = dateObj.getDate() === now.getDate() && dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const isYesterday = dateObj.getDate() === yesterday.getDate() && dateObj.getMonth() === yesterday.getMonth() && dateObj.getFullYear() === yesterday.getFullYear();
          if (isToday) {
            timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          } else if (isYesterday) {
            timeStr = 'yesterday';
          } else {
            // Format as dd/mm/yy
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = String(dateObj.getFullYear()).slice(-2);
            timeStr = `${day}/${month}/${year}`;
          }
        }
      }
      return (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
          <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {isSent && (
              <svg width="12" height="12" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 4}}>
                <path d="M3.05 24.95L25 15.5C25.8333 15.1667 25.8333 13.8333 25 13.5L3.05 4.05C2.21667 3.71667 1.38333 4.55 1.71667 5.38333L4.95 13.5L1.71667 21.6167C1.38333 22.45 2.21667 23.2833 3.05 22.95Z" fill="var(--primary)" />
              </svg>
            )}
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: "30vw" }}>{lastMessage.content}</span>
          </span>
          {timeStr && (
            <span style={{ color: 'var(--gray-text)', fontSize: 12, fontWeight: 100, marginTop: 2, marginLeft: isSent ? 18 : 0, whiteSpace: 'nowrap' }}>{timeStr}</span>
          )}
        </span>
      );
    }
    // If there is a lastMessage object (even if only one), but no content, show nothing
    if (lastMessage && !lastMessage.content) {
      return null;
    }
    // Otherwise, show New match!
  return <span style={{ color: 'var(--primary)', fontWeight: 175, marginLeft:'0.5vw' }}>{t('new_match', 'New match!')}</span>;
  }

  return (
    <div
      onClick={() => onChat(match)}
      className="chat-match-card"
      style={{
        cursor: "pointer",
        background: "var(--glass-bg)",
        borderRadius: 13,
        boxShadow: "var(--shadow)",
        marginBottom: 0,
        height: "16.5vh",
        width: "90vw",
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
            background: "var(--primary)",
            borderRadius: "50%",
            zIndex: 2,
            border: "2.5px solid var(--glass-bg)",
            boxShadow: '0 0 0 2px var(--gray-border)',
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
          marginTop: "22px",
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          minWidth: '30vw',
          gap: 10,
          height: '100%',
          padding: '1.5vh 0vh 0.5vh 1.5vw',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontWeight: 175,
            fontSize: '1.05rem',
            color: "var(--primary-dark)",
            letterSpacing: 0.2,
            lineHeight: 1.7,
            minWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {match.otherUser.name || match.otherUser.displayName}
          {/* Bubbles: big (their items), small (your items), side by side, big overlaps small, much more to the right */}
          {(theirItemsCount > 0 || yourItemsCount > 0) && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              right: '10vw',
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}>
              {/* Small bubble: your items */}
              {yourItemsCount > 0 && (
                <span style={{
                  background: 'var(--primary-dark)',
                  color: 'var(--text)',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 175,
                  fontSize: 10,
                  boxShadow: 'var(--shadow)',
                  border: '2px solid var(--glass-bg)',
                  zIndex: 20,
                  marginRight: -30,
                }}>{yourItemsCount}</span>
              )}
              {/* Big bubble: their items, overlaps small */}
              {theirItemsCount > 0 && (
                <span style={{
                  background: 'var(--primary)',
                  color: 'var(--text)',
                  borderRadius: '50%',
                  width: 25,
                  height: 25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 175,
                  fontSize: 13,
                  boxShadow: 'var(--shadow)',
                  border: '2.5px solid var(--glass-bg)',
                  zIndex: 30,
                  marginLeft: -20,
                }}>{theirItemsCount}</span>
              )}
            </span>
          )}
        </div>
  <div style={{ width: '95%', borderBottom: '1.5px solid var(--gray-border)', margin: '0px 0 0px 0' }} />
        <div
          style={{
            lineHeight: 1.3,
            fontWeight: lastMessage && lastMessage.sender === currentUserId ? 100 : 150,
            fontSize: '0.9rem',
            color: "var(--gray-text)",
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
