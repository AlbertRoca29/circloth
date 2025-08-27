import React, { useState, useEffect, useRef } from "react";
import '../styles/ChatAbsolute.css';
import { useTranslation } from "react-i18next";
import { fetchMessages, sendMessage, fetchUserChats } from "../api/chatApi";
import ChatMatchCard from "../components/ChatMatchCard";
import ItemList from "../components/ItemList";
import { fetchMatches } from "../api/matchingApi";
import { CATEGORIES } from "../constants/categories";
import ItemDetailModal from "../components/ItemDetailModal";
import LoadingSpinner from '../components/LoadingSpinner';
import "../styles/buttonStyles.css";
import { CloseIcon, BackIcon } from '../constants/icons';


function Chats({ user, onModalOpenChange }) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState([]);
  const [chattingWith, setChattingWith] = useState(null); // match
  const [viewingTheirProfile, setviewingTheirProfile] = useState(null);
  const [viewingYourProfile, setviewingYourProfile] = useState(null);
  const [itemListModalOpen, setItemListModalOpen] = useState(false);


  // Chat UI hooks (always defined, only used if chattingWith is set)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const messagesEndRef = useRef(null);


    // Grouping logic in useMemo so it recalculates every time matches changes
    const groupedArr = React.useMemo(() => {
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
        // Set isUnread true if any originalMatches are unread
        group.isUnread = group.originalMatches.some(m => m.isUnread);
      });
      return Object.values(grouped);
    }, [matches]);

  // Modify fetchAndSetMatches to only fetch matches without loading chats
  const fetchAndSetMatches = async () => {
    if (!user || !user.uid) return;
    const matches = await fetchMatches(user.uid);
    setMatches(matches);
  };

  // Initial fetch and polling for matches/unread status
  useEffect(() => {
    if (!user || !user.uid) return;
    const fetchData = async () => {
        setIsLoading(true);
        await fetchAndSetMatches();
        setIsLoading(false);
    };

    fetchData();
    // const interval = setInterval(fetchAndSetMatches, 5000); // Poll every 5 seconds
    // return () => clearInterval(interval);
  }, [user]);

  // Update the onChat handler to dynamically fetch chat messages
  const handleChatClick = async (chatObj) => {
    setChattingWith(chatObj);
    setLoading(true);
    try {
      const msgs = await fetchMessages(user.uid, chatObj.otherUser.id);
      setMessages(msgs);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (isLoading && matches.length === 0) {
      const timer = setTimeout(() => setShowSpinner(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [isLoading, matches]);

  // Update chat messages every 3 seconds when a chat is active
  useEffect(() => {
    if (chattingWith) {
      const interval = setInterval(async () => {
        const msgs = await fetchMessages(user.uid, chattingWith.otherUser.id);
        setMessages(msgs);
      }, 3000); // Update every 3 seconds

      return () => clearInterval(interval); // Cleanup on unmount or when chattingWith changes
    }
  }, [chattingWith, user]);


  if (showSpinner) {
    return <LoadingSpinner />;
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
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, borderRadius: 8, border: '1px solid #ddd', padding: 8, fontSize: 15, lineHeight: '1.5' }} />
            <button type="submit" style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 15, cursor: 'pointer' }}>{t('send')}</button>
          </form>
          <button
            onClick={() => setChattingWith(null)}
            aria-label="Go back"
            className="common-button go-back"
            style={{ top: -20, right: -20 }}
          >
            <CloseIcon />
          </button>
          </div>
        </div>
      );
    }
  // Default chat UI
  return (
      <div className="chat-absolute-overlay">
        <div className="chat-absolute-content card" style={{ maxWidth: 420, borderRadius: 18, minHeight: 300, display: 'flex', flexDirection: 'column', height: 500 }}>
        <div style={{ fontWeight: 200, fontSize: 18, color: '#15803d', marginBottom: 10, marginLeft: 27 }}>
          {t('chat_with', { name: chattingWith.otherUser.name || chattingWith.otherUser.displayName })}
        </div>
  <div className="chat-absolute-scroll" style={{ background: '#f6f6f6', borderRadius: 10, padding: 10, marginBottom: 10 }}>
          {loading && <div style={{ color: '#888', fontSize: 13 }}>Loading...</div>}
          {messages.map((msg, i) => (
            <div key={i} style={{
              textAlign: msg.sender === user.uid ? 'right' : 'left',
              margin: '6px 0',
              lineHeight: '1.5',
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
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, borderRadius: 8, border: '1px solid #ddd', padding: 11, fontSize: 15.5 }} />
          <button type="submit" style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 15, cursor: 'pointer' }}>{t('send')}</button>
        </form>
  <button
    onClick={() => setChattingWith(null)}
    aria-label="Go back"
    className="common-button go-back"
    style={{ top: -18, left: -18 }}
  >
    <CloseIcon />
  </button>
        </div>
      </div>
    );
  }

  const handleViewProfile = (user, yours=false) => {
    if (yours) {
      setviewingYourProfile(user);
    }
    else{
        setviewingTheirProfile(user);
    }
  };

  if (viewingTheirProfile) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', marginTop: 30 }}>
        <button
          onClick={() => setviewingTheirProfile(null)}
          className="common-button go-back"
          style={{ top:-30}}
        >
            <BackIcon />

        </button>
        <ItemList
          user={viewingTheirProfile}
          onModalOpenChange={setItemListModalOpen}
          buttons="like_pass"
          from_user_matching={user}
        />
      </div>
    );
  }
  if (viewingYourProfile) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', marginTop: 30 }}>
        <button
          onClick={() => setviewingYourProfile(null)}
          className="common-button go-back"
          style={{ top:-30}}
        >
            <BackIcon />

        </button>
        <ItemList
          user={user}
          onModalOpenChange={setItemListModalOpen}
          buttons="none"
        />
      </div>
    );
  }



  return (
    <div style={{ maxWidth: 500, margin: '0 auto', marginTop: 30 }}>
      {matches.length === 0 && !isLoading && (
        <div className="card" style={{ textAlign: 'center', color: '#469061ff', fontSize: '1.2rem', marginTop: 40, fontWeight: 150, lineHeight: "1.45em" }}>
          {t('no_matches_cool')}
        </div>
      )}
      {groupedArr.map((group, idx) => {
        return (
          <ChatMatchCard
            key={group.matchIds.join('-')}
            match={group}
            isUnread={group.isUnread}
            onChat={handleChatClick} // Use the new handler
            onViewProfile={handleViewProfile}
          />
        );
      })}
    </div>
  );
}

export default Chats;
