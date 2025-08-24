import React, { useState, useEffect, useRef } from "react";
import './ChatAbsolute.css';
import { useTranslation } from "react-i18next";
import { fetchMessages, sendMessage } from "./chatApi";
import ChatMatchCard from "./ChatMatchCard";
import ItemList from "./ItemList";
import { fetchMatches, fetchMatchesWithLocation } from "./matchingApi";
import { CATEGORIES } from "./utils/categories";
import ItemDetailModal from "./ItemDetailModal";


function Chats({ user }) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState([]);
  const [showItem, setShowItem] = useState(null); // {item, otherUser}
  const [chattingWith, setChattingWith] = useState(null); // match

  // Chat UI hooks (always defined, only used if chattingWith is set)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
      // Try to get geolocation, if allowed, fetch with location, else random
      if (!user || !user.uid) return;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchMatchesWithLocation(user.uid, pos.coords).then(setMatches);
          },
          () => {
            fetchMatches(user.uid).then(setMatches);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        fetchMatches(user.uid).then(setMatches);
      }
  }, [user]);

  // Chat message polling effect
  useEffect(() => {
    let active = true;
    async function load() {
      if (!chattingWith) return;
      setLoading(true);
      try {
        const msgs = await fetchMessages(user.uid, chattingWith.otherUser.id);
        if (active) setMessages(msgs);
      } finally {
        setLoading(false);
      }
    }
    if (chattingWith) {
      load();
      const interval = setInterval(load, 3000);
      return () => { active = false; clearInterval(interval); };
    }
  }, [chattingWith, user.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !chattingWith) return;
    await sendMessage(user.uid, chattingWith.otherUser.id, input);
    setInput("");
    // Refresh messages
    const msgs = await fetchMessages(user.uid, chattingWith.otherUser.id);
    setMessages(msgs);
  }


  // Disable body scroll when chat is open
  useEffect(() => {
    if (chattingWith) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [chattingWith]);

  // Disable body scroll when ItemDetailModal is open
  useEffect(() => {
    if (showItem) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [showItem]);

  if (showItem) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
        <ItemDetailModal
          item={showItem.item}
          open={true}
          onClose={() => setShowItem(null)}
          showNavigation={true}
        />
      </div>
    );
  }

  if (chattingWith) {
    if (chattingWith.theirItems && chattingWith.theirItems.length === 2) {
      return (
        <div className="chat-absolute-overlay">
          <div className="chat-absolute-content card" style={{ maxWidth: 650, borderRadius: 24, minHeight: 400, display: 'flex', flexDirection: 'column', height: 650, alignItems: 'center', padding: 32 }}>
          <div style={{ fontWeight: 200, fontSize: 18, color: '#15803d', marginBottom: 18 }}>
            {chattingWith.otherUser.name || chattingWith.otherUser.displayName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 18, marginBottom: 12 }}>
            {chattingWith.theirItems.map((item, i) => (
              <img
                key={item.id || i}
                src={item.photoURLs?.[0]}
                alt={`Their item ${i + 1}`}
                loading="lazy"
                style={{ width: 110, height: 110, borderRadius: 18, objectFit: 'cover', border: '2.5px solid #e0e0e0', background: '#f6f6f6' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 15, color: '#aaa' }}>{t('your_item')}:</span>
            <img
              src={chattingWith.yourItem?.photoURLs?.[0]}
              alt="Your item"
              loading="lazy"
              style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #e0e0e0' }}
            />
          </div>
          <div className="chat-absolute-scroll" style={{ background: '#f6f6f6', borderRadius: 10, padding: 10, marginBottom: 10, width: '100%' }}>
            {loading && <div style={{ color: '#888', fontSize: 13 }}>Loading...</div>}
            {messages.map((msg, i) => (
              <div key={i} style={{
                textAlign: msg.sender === user.uid ? 'right' : 'left',
                margin: '6px 0',
              }}>
                <span style={{
                  display: 'inline-block',
                  background: msg.sender === user.uid ? '#bbf7d0' : '#fff',
                  color: '#222',
                  borderRadius: 8,
                  padding: '6px 12px',
                  maxWidth: '70%',
                  wordBreak: 'break-word',
                  fontSize: 15,
                }}>{msg.content}</span>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, borderRadius: 8, border: '1px solid #ddd', padding: 8, fontSize: 15 }} />
            <button type="submit" style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 15, cursor: 'pointer' }}>{t('send')}</button>
          </form>
          <button onClick={() => setChattingWith(null)} style={{ background: '#f3f3f3', color: '#444', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 14, cursor: 'pointer', marginTop: 10 }}>{t('back')}</button>
          </div>
        </div>
      );
    }
  // Default chat UI
  return (
      <div className="chat-absolute-overlay">
        <div className="chat-absolute-content card" style={{ maxWidth: 420, borderRadius: 18, minHeight: 300, display: 'flex', flexDirection: 'column', height: 500 }}>
        <div style={{ fontWeight: 200, fontSize: 18, color: '#15803d', marginBottom: 10 }}>
          {t('chat_with', { name: chattingWith.otherUser.name || chattingWith.otherUser.displayName })}
        </div>
  <div className="chat-absolute-scroll" style={{ background: '#f6f6f6', borderRadius: 10, padding: 10, marginBottom: 10 }}>
          {loading && <div style={{ color: '#888', fontSize: 13 }}>Loading...</div>}
          {messages.map((msg, i) => (
            <div key={i} style={{
              textAlign: msg.sender === user.uid ? 'right' : 'left',
              margin: '6px 0',
            }}>
              <span style={{
                display: 'inline-block',
                background: msg.sender === user.uid ? '#bbf7d0' : '#fff',
                color: '#222',
                borderRadius: 8,
                padding: '6px 12px',
                maxWidth: '70%',
                wordBreak: 'break-word',
                fontSize: 15,
              }}>{msg.content}</span>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, borderRadius: 8, border: '1px solid #ddd', padding: 8, fontSize: 15 }} />
          <button type="submit" style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 15, cursor: 'pointer' }}>{t('send')}</button>
        </form>
  <button onClick={() => setChattingWith(null)} style={{ background: '#f3f3f3', color: '#444', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 14, cursor: 'pointer', marginTop: 10 }}>{t('back')}</button>
        </div>
      </div>
    );
  }

  // Group matches: key = otherUser.id + yourItem.id, value = {otherUser, yourItem, theirItems: []}
  const grouped = {};
  matches.forEach(m => {
    const yourItemId = Array.isArray(m.yourItems) && m.yourItems.length === 1 ? m.yourItems[0].id : m.yourItem?.id;
    const key = m.otherUser.id + "_" + yourItemId;
    if (!grouped[key]) {
      // Always set yourItems as an array
      let yourItemsArr = Array.isArray(m.yourItems) ? m.yourItems : (m.yourItem ? [m.yourItem] : []);
      grouped[key] = {
        otherUser: m.otherUser,
        yourItems: yourItemsArr,
        theirItems: [],
        matchIds: [],
        originalMatches: [],
        theirItem: undefined, // will set below
      };
    }
    grouped[key].theirItems.push(m.theirItem);
    // Always set theirItem to the first in theirItems for default card
    if (!grouped[key].theirItem && m.theirItem) {
      grouped[key].theirItem = m.theirItem;
    }
    grouped[key].matchIds.push(m.id);
    grouped[key].originalMatches.push(m);
  });

  // After grouping, ensure theirItem is set for all groups (fallback to first in theirItems)
  Object.values(grouped).forEach(group => {
    if (!group.theirItem && group.theirItems.length > 0) {
      group.theirItem = group.theirItems[0];
    }
  });

  const groupedArr = Object.values(grouped);

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', marginTop: 30 }}>
      {matches.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#469061ff', fontSize: '1.2rem', marginTop: 40, fontWeight: 150, lineHeight: "1.45em" }}>
          {t('no_matches_cool')}
        </div>
      )}
      {groupedArr.map((group, idx) => (
        <ChatMatchCard
          key={group.matchIds.join('-')}
          match={group}
          onShowDetails={itemObj => setShowItem(itemObj)}
          onChat={chatObj => setChattingWith(chatObj)}
        />
      ))}
    </div>
  );
}

export default Chats;
