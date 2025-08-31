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

function ChatMatchCard({ match, onChat, isUnread, onViewProfile }) {
  const { t } = useTranslation();

  return (
    <div
      onClick={() => onChat(match)}
      className="chat-match-card"
      style={{
        cursor: "pointer",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        height: "20vh",
        marginBottom: 24,
        width: "100%",
        display: "flex",
        alignItems: "center",
        position: "relative",
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
            background: "red",
            borderRadius: "50%",
            zIndex: 2,
            border: "3px solid #ffffffd6",
          }}
        />
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 0,
          height: "100%",
          aspectRatio: "1",
          marginRight: 20,
          borderRadius: 12,
          position: 'relative',
          overflow: 'hidden',
          alignItems: 'stretch',
          justifyItems: 'stretch',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <ItemGrid items={match.theirItems} size={85} borderRadius={0} border={0} fontSize={28} />
      </div>

      <div
          style={{
            position: "absolute",
            display: 'none', //grid
            // gridTemplateColumns: '1fr 1fr',
            // gridTemplateRows: '1fr 1fr',
            gap: 0,
            height: "100%",
            aspectRatio: "0.9",
            borderRadius: 6,
            border: '0px solid #ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ItemGrid items={match.yourItems || []} size={0} borderRadius={0} border={0} fontSize={16} />
      </div>
      <div style={{
        position: "relative",
        height: "70%",
        background: "green",
        width: "50%",
        marginLeft: "10px",
        textAlign: "left",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "left",
      }}>
      <div
          style={{
            width: "100%",
            fontWeight: 150,
            fontSize: 19,
            color: "#147939ff",
          }}
        >
          {match.otherUser.name || match.otherUser.displayName}
        </div>
        <div style={{
              lineHeight:1.5,
              width: "100%",
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
