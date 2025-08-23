import React, { useState, useEffect, useRef } from "react";
import { fetchMessages, sendMessage } from "./chatApi";
import ChatMatchCard from "./ChatMatchCard";
import ItemList from "./ItemList";
import { fetchMatches } from "./matchingApi";


function Chats({ user }) {
  const [matches, setMatches] = useState([]);
  const [showItem, setShowItem] = useState(null); // {item, otherUser}
  const [chattingWith, setChattingWith] = useState(null); // match

  // Chat UI hooks (always defined, only used if chattingWith is set)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMatches(user.uid).then(setMatches);
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

  if (showItem) {
    // Show item details modal (reuse ItemList modal style)
    const item = showItem.item;
    return (
      <div style={{ position: 'fixed', top: 300, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.08)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(34,197,94,0.13)', padding: '2.2rem 1.5rem', minWidth: 380, maxWidth: 450, width: '100%', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', margin: 0 }}>
          <img src={item.photoURLs?.[0]} alt="item" loading="lazy" style={{ maxWidth: '100%', maxHeight: 340, borderRadius: 12, objectFit: 'contain', background: '#f6f6f6', marginBottom: 16 }} />
          <div style={{ marginBottom: 8 }}><strong>Category:</strong> {item.category}</div>
          {item.color && <div style={{ marginBottom: 8 }}><strong>Color:</strong> <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: item.color, border: '1.5px solid #eee', verticalAlign: 'middle' }}></span></div>}
          {item.size && <div style={{ marginBottom: 8 }}><strong>Size:</strong> {item.size}</div>}
          {item.material && <div style={{ marginBottom: 8 }}><strong>Material:</strong> {item.material}</div>}
          {item.sizeDetails && <div style={{ marginBottom: 8 }}><strong>Size details:</strong> {item.sizeDetails}</div>}
          {item.additionalInfo && <div style={{ marginBottom: 8 }}><strong>Info:</strong> {item.additionalInfo}</div>}
          {item.itemStory && <div style={{ marginBottom: 8, background: '#fffbe6', borderRadius: 8, padding: '8px 12px', color: '#eab308', fontWeight: 100 }}><span style={{ marginRight: 6 }}>📝</span>{item.itemStory}</div>}
          <button onClick={() => setShowItem(null)} style={{ marginTop: 18, background: '#22c55e', color: '#fff', border: 'none', borderRadius: '50%', padding: 12, fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(34, 197, 94, 0.13)', transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s' }} title="Close"><span role="img" aria-label="close">❌</span></button>
        </div>
      </div>
    );
  }

  if (chattingWith) {
    // Simple chat UI
    return (
      <div className="card" style={{ maxWidth: 420, margin: '0 auto', marginTop: 30, borderRadius: 18, minHeight: 300, display: 'flex', flexDirection: 'column', height: 500 }}>
        <div style={{ fontWeight: 200, fontSize: 18, color: '#15803d', marginBottom: 10 }}>
          Chat with {chattingWith.otherUser.name || chattingWith.otherUser.displayName}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: '#f6f6f6', borderRadius: 10, padding: 10, marginBottom: 10 }}>
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
          <button type="submit" style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 15, cursor: 'pointer' }}>Send</button>
        </form>
        <button onClick={() => setChattingWith(null)} style={{ background: '#f3f3f3', color: '#444', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 14, cursor: 'pointer', marginTop: 10 }}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', marginTop: 30 }}>
      {matches.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#64748b', fontSize: '1.2rem', marginTop: 40 }}>
          No matches yet.
        </div>
      )}
      {matches.map(match => (
        <ChatMatchCard
          key={match.id}
          match={match}
          onShowDetails={m => setShowItem({ item: m.theirItem, otherUser: m.otherUser })}
          onChat={m => setChattingWith(m)}
        />
      ))}
    </div>
  );
}

export default Chats;
