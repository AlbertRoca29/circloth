import React from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "../utils/general";

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
    return [
      <ItemImage
        key={items[0].id || 0}
        item={items[0]}
        alt={`item 1`}
        style={{
          ...baseStyle,
          gridColumn: '1 / span 2',
          gridRow: '1',
        }}
      />,
      <ItemImage
        key={items[1].id || 1}
        item={items[1]}
        alt={`item 2`}
        style={{
          ...baseStyle,
          gridColumn: '1',
          gridRow: '2',
        }}
      />,
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
    ];
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

function ChatMatchCard({ match, onChat, isUnread, onViewProfile }) {
  const { t } = useTranslation();

  return (
    <div
      onClick={() => onChat(match)}
      className="chat-match-card"
      style={{
        cursor: "pointer",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 14px rgba(0,0,0,0.09)",
        padding: 14,
        marginBottom: 24,
        width: "100%",
        minHeight: "80px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
        gap: 16,
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
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 4,
          width: 100,
          height: 100,
          marginRight: 8,
          borderRadius: 12,
          border: '2px solid #ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ItemGrid items={match.theirItems} size={85} borderRadius={0} border={0} fontSize={28} />
      </div>

      <div
          style={{
            position: "absolute",
            marginTop: "2.5vh",
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 1.5,
            width: 60,
            height: "100%",
            borderRadius: 6,
            border: '0px solid #ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ItemGrid items={match.yourItems || []} size={36} borderRadius={0} border={0} fontSize={16} />
      </div>
      <div style={{
        height: "9vh",
        marginLeft:"5vw",
        width: "30vw",
        textAlign: "center",
        background:"transparent",
      }}>
      <div
          style={{
            fontWeight: 150,
            fontSize: 19,
            color: "#15803d",
          }}
        >
          {match.otherUser.name || match.otherUser.displayName}
        </div>
        <div style={{
              lineHeight:2,
              fontWeight: 150,
              fontSize: 14,
              color: "#888888ff",
            }}>
              text de prova
        </div>
      </div>
    </div>
  );
}

export default ChatMatchCard;
