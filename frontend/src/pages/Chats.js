import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { fetchMessages, sendMessage, fetchUserChats } from "../api/chatApi";
import ChatMatchCard from "../components/ChatMatchCard";
import ItemList from "../components/ItemList";
import { getCachedOrFreshMatches, fetchMatches } from "../api/matchingApi";
import LoadingSpinner from '../components/LoadingSpinner';
import "../styles/buttonStyles.css";
import { CloseIcon, BackIcon } from '../constants/icons';
import { HeartIcon } from '../utils/svg';
// IoSend icon for send button




function Chats({ user, onUnreadChange, refreshUnread, onChatClose }) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState([]); // Store chat list with unread info
  const [chattingWith, setChattingWith] = useState(null); // match
  const [viewingTheirProfile, setviewingTheirProfile] = useState(null);
  const [viewingYourProfile, setviewingYourProfile] = useState(null);
  // New state for trade view
  const [viewingTrade, setViewingTrade] = useState(null); // { otherUser, yourItems, theirItems }
  const [itemListModalOpen, setItemListModalOpen] = useState(false);

  // Expand/collapse state for trade view item lists (must be at top level)
  const [expandTheir, setExpandTheir] = useState(false);
  const [expandYours, setExpandYours] = useState(false);

  // Chat UI hooks (always defined, only used if chattingWith is set)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const messagesEndRef = useRef(null);

  // Always call this useEffect to comply with hooks rules (must be at the top of the component)
  useEffect(() => {
    if (viewingTrade && !viewingTheirProfile) {
      document.body.style.overflow = '';
    } else if (chattingWith) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [viewingTrade, viewingTheirProfile, chattingWith]);


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
            isUnread: false, // default, will set below
          };
        }
        grouped[key].theirItems.push(m.theirItem);
        if (!grouped[key].theirItem && m.theirItem) {
          grouped[key].theirItem = m.theirItem;
        }
        grouped[key].matchIds.push(m.id);
        grouped[key].originalMatches.push(m);
      });
      // Merge unread status from chats
      Object.values(grouped).forEach(group => {
        if (!group.theirItem && group.theirItems.length > 0) {
          group.theirItem = group.theirItems[0];
        }
        // Find chat for this user
        const chat = chats.find(c => c.participants && c.participants.includes(group.otherUser.id));
        group.isUnread = chat ? !!chat.is_unread : false;
      });
      return Object.values(grouped);
    }, [matches, chats]);

    // Notify parent if any chat is unread
    React.useEffect(() => {
      if (onUnreadChange) {
        const anyUnread = groupedArr.some(g => g.isUnread);
        onUnreadChange(anyUnread);
      }
    }, [groupedArr, onUnreadChange]);


  // Fetch matches and chats in parallel
  const fetchAndSetMatchesAndChats = async () => {
    if (!user || !user.uid) return;
    const [matches, chats] = await Promise.all([
      getCachedOrFreshMatches(user.uid),
      fetchUserChats(user.uid)
    ]);
    setMatches(matches);
    setChats(chats);
  };

  // Fetch unread/matches when user or refreshUnread changes
  useEffect(() => {
    if (!user || !user.uid) return;
    const fetchData = async () => {
      setIsLoading(true);
      await fetchAndSetMatchesAndChats();
      setIsLoading(false);
    };
    fetchData();
    // Optionally poll for unread status
    // const interval = setInterval(fetchAndSetMatchesAndChats, 5000);
    // return () => clearInterval(interval);
  }, [user, refreshUnread]);

  // Call onChatClose when chat is closed
  useEffect(() => {
    if (typeof onChatClose !== 'function') return;
    if (chattingWith === null) {
      onChatClose();
    }
    // Only run when chattingWith changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chattingWith]);

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


  // (Removed duplicate/conditional useEffect for body scroll. Now handled by the unified useEffect below.)

  useEffect(() => {
    if (isLoading && matches.length === 0) {
      const timer = setTimeout(() => setShowSpinner(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [isLoading, matches]);

  // WebSocket for real-time chat
  const wsRef = useRef(null);
  useEffect(() => {
    if (!chattingWith || !user?.uid) return;
    // Open WebSocket connection
    const user1 = user.uid;
    const user2 = chattingWith.otherUser.id;
    // Use ws:// for local dev, wss:// for production
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${window.location.hostname}:${window.location.port || (wsProtocol === "wss" ? "443" : "80")}/ws/chat/${user1}/${user2}`;
    const ws = new window.WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Optionally, fetch initial messages
      fetchMessages(user.uid, chattingWith.otherUser.id).then(setMessages);
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg && msg.sender && msg.receiver && msg.content) {
          setMessages(prev => [...prev, { ...msg, timestamp: Date.now() }]);
        }
      } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [chattingWith, user]);


  if (showSpinner) {
    return <LoadingSpinner />;
  }



  // Move handleViewProfile above its first usage
  const handleViewProfile = (user, yours=false) => {
    if (yours) {
      setviewingYourProfile(user);
    } else {
      setviewingTheirProfile(user);
    }
  };

  // Handler for viewing the trade
  const handleViewTrade = (chatObj) => {
    // chatObj is the group object from groupedArr
    setViewingTrade({
      otherUser: chatObj.otherUser,
      yourItems: chatObj.yourItems,
      theirItems: chatObj.theirItems,
      group: chatObj
    });
  };





  // Trade view main
  if (viewingTrade) {
    // If viewing their profile from trade view, show only their items with bigger font and an exit profile view button
    if (viewingTheirProfile) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 30, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist', overflow: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 3px 7px rgba(0, 0, 0, 0.2)', width: '90vw', height: '78vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', top: "-1vh" }}>
            {/* App-like header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#22c55e', padding: '11px 0 9px 0', position: 'relative' }}>
              <div style={{ fontWeight: 150, fontSize: 18, color: '#fff', flex: 1, textAlign: 'center', letterSpacing: 0.2 }}>
                {t('trade_view_title', 'Trade View')}
              </div>
              <button
                onClick={() => setViewingTrade(null)}
                aria-label="Close trade view"
                style={{ position: 'absolute', right: 12, top: 4, border: 'none', background: 'transparent', fontSize: 26, fontFamily: 'Geist', fontWeight: 100, cursor: 'pointer', color: '#fff', padding: '-1px 8px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0, 0, 0, 0)', transition: 'background 0.18s' }}
                onMouseOver={e => e.currentTarget.style.background = '#fff4'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              >
                ×
              </button>
            </div>
            {/* Profile view: only their items, bigger font, exit profile view button */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '32px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, background: '#f8f8f8', height: '100%' }}>
              <div style={{ width: '92%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#15803d', fontWeight: 200, fontSize: 18, letterSpacing: 0.5 }}>{t('their_items', 'Their items')}</span>
                <button
                  onClick={() => setviewingTheirProfile(null)}
                  style={{
                    fontFamily: 'Geist',
                    background: '#f87171', // red-400
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontWeight: 500,
                    fontSize: 15,
                    cursor: 'pointer',
                    marginLeft: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.18)',
                    transition: 'background 0.18s',
                    outline: 'none',
                  }}
                  title={t('exit_profile_view', 'Exit profile view')}
                  onMouseOver={e => e.currentTarget.style.background = '#dc2626'} // red-600
                  onMouseOut={e => e.currentTarget.style.background = '#f87171'}
                >
                  {t('exit_profile_view', 'Exit profile view')}
                </button>
              </div>
              <ItemList
                user={viewingTheirProfile}
                onModalOpenChange={() => {}}
                buttons="like_pass"
                matching={true}
                from_user_matching={user}
                maxItems={4}
                expanded={true}
                // No expand/collapse in profile view
              />
            </div>
          </div>
        </div>
      );
    }
    // Normal trade view (not in profile view)
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 30, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist', overflow: 'auto' }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 3px 7px rgba(0, 0, 0, 0.2)', width: '90vw',height: '78vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', top:"-1vh" }}>
          {/* App-like header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#22c55e', padding: '11px 0 9px 0', position: 'relative' }}>
            <div style={{ fontWeight: 150, fontSize: 18, color: '#fff', flex: 1, textAlign: 'center', letterSpacing: 0.2 }}>
              {t('trade_view_title', 'Trade View')}
            </div>
            <button
              onClick={() => setViewingTrade(null)}
              aria-label="Close trade view"
              style={{ position: 'absolute', right: 12, top: 4, border: 'none', background: 'transparent', fontSize: 26, fontFamily: 'Geist', fontWeight: 100, cursor: 'pointer', color: '#fff', padding: '-1px 8px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0, 0, 0, 0)', transition: 'background 0.18s' }}
              onMouseOver={e => e.currentTarget.style.background = '#fff4'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            >
              ×
            </button>
          </div>
          {/* Main trade content: two ItemLists stacked vertically */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, background: '#f8f8f8', height: '100%' }}>
            {/* Their Items */}
            <div style={{ width: '92%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#15803d', fontWeight: 400, fontSize: 15 }}>{t('their_items', 'Their items')}</span>
              <button
                onClick={() => setviewingTheirProfile(viewingTrade.otherUser)}
                style={{
                  fontFamily: 'Geist',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontWeight: 170,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginLeft: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
                  transition: 'background 0.18s'
                }}
                title={t('view_profile', 'View profile')}
                onMouseOver={e => e.currentTarget.style.background = '#15803d'}
                onMouseOut={e => e.currentTarget.style.background = '#22c55e'}
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 2}}>
                  <circle cx="10" cy="7.5" r="3.5" stroke="#fff" strokeWidth="1.5"/>
                  <path d="M3.5 16c0-2.485 2.5-4.5 6.5-4.5s6.5 2.015 6.5 4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {t('view_profile', 'Profile')}
              </button>
            </div>
            <ItemList
              user={{ ...viewingTrade.otherUser, items: viewingTrade.theirItems }}
              onModalOpenChange={() => {}}
              buttons="like_pass"
              only_likes={true}
              matching={true}
              from_user_matching={user}
              maxItems={2}
              expanded={expandTheir}
              onExpand={() => setExpandTheir(e => !e)}
            />
            {/* Your Items */}
            <div style={{ width: '92%', display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: '#15803d', fontWeight: 400, fontSize: 15 }}>{t('your_items', 'Your Items')}</span>
            </div>
            <ItemList
              user={{ ...user, items: viewingTrade.yourItems }}
              onModalOpenChange={() => {}}
              buttons="none"
              matching={true}
              from_user_matching={viewingTrade.otherUser}
              maxItems={2}
              expanded={expandYours}
              onExpand={() => setExpandYours(e => !e)}
            />
          </div>
        </div>
      </div>
    );
  }

  // ...existing code...

  if (chattingWith) {
    return (
         <div style={{ position: 'fixed', top: '9%', width: '100%', height: '79vh', zIndex: 10, background: 'transparent', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist' }}>

  <div style={{ borderRadius: 18, display: 'flex', flexDirection: 'column', width: '95%', height: '90%', background: '#fff', boxShadow: '0 1.5px 6px #0003', position: 'relative' }}>
          {/* Name at the top */}
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', padding: '18px 24px 0 24px', background: '#f6f6f6', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
            <div style={{ fontWeight: 500, fontSize: 18, color: '#15803d', flex: 1, textAlign: 'left' }}>
              {chattingWith.otherUser.name || chattingWith.otherUser.displayName}
            </div>
          </div>
          <div style={{ position: 'absolute', top: '10px', right: '20px', cursor: 'pointer' }}>
            <button
                onClick={() => setChattingWith(null)}
                aria-label="Go back"
                style={{ border: 'none', background: 'none', fontSize: 20, fontFamily: 'Geist', fontWeight: 100, cursor: 'pointer' ,color: '#555' }}
                >
                x
            </button>
          </div>
          {/* Button below name */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '13px 24px 15px 24px', background: '#f6f6f6', fontWeight: 150, borderBottom: '1px solid #e5e5e5' }}>
            <div
              onClick={() => handleViewTrade(chattingWith)}
              style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 9, padding: '12px 18px', fontSize: 16, cursor: 'pointer', outline: 'none', display: 'inline-flex', alignItems: 'center', textAlign: 'center', userSelect: 'none', gap: 8 }}
            >
              <HeartIcon style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('look_at_the_trade', 'Look at the trade')}
            </div>
          </div>
          {/* Chat messages */}
          <div style={{ background: '#f6f6f6', borderRadius: 10, padding: 10, margin: 16, flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {loading && <div style={{ color: '#888', fontSize: 13 }}>Loading...</div>}
            {messages.filter(msg => msg && msg.sender && msg.content).map((msg, i) => (
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
          {/* Input area: input and send icon only, no button border/background */}
          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', padding: '0 18px 18px 18px', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('type_a_message', 'Type a message...')}
              style={{ flex: 1, borderRadius: 20, border: '1px solid #ddd', padding: '11px 16px', fontSize: 15.5, outline: 'none', background: '#fafafa' }}
            />
            <button
              type="submit"
              style={{ background: 'none', border: 'none', padding: 0, marginLeft: 2, cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
              aria-label="Send"
              disabled={!input.trim()}
            >
              {/* WhatsApp-like send icon SVG */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.05 24.95L25 15.5C25.8333 15.1667 25.8333 13.8333 25 13.5L3.05 4.05C2.21667 3.71667 1.38333 4.55 1.71667 5.38333L4.95 13.5L1.71667 21.6167C1.38333 22.45 2.21667 23.2833 3.05 22.95Z" fill={input.trim() ? '#22c55e' : '#bbb'} />
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  }


  return (
  <div style={{ width: '80%', margin: '90px 0 0 10%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {matches.length === 0 && !isLoading && (
        <div className="card" style={{ textAlign: 'center', color: '#469061ff', fontSize: '1.2rem', marginTop: 40, fontWeight: 150, lineHeight: "1.45em" }}>
          {t('no_matches_cool')}
        </div>
      )}
      {[...groupedArr]
        .map(group => {
          // Find the chat for this group
          const chat = chats.find(c => c.participants && c.participants.includes(group.otherUser.id));
          // Get last valid message with content, regardless of sender
          let lastMessage = null;
          let lastTimestamp = 0;
          if (chat && Array.isArray(chat.messages) && chat.messages.length > 0) {
            for (let i = chat.messages.length - 1; i >= 0; i--) {
              const m = chat.messages[i];
              if (m && typeof m.content === 'string' && m.content.trim() !== '') {
                lastMessage = m;
                lastTimestamp = m.timestamp ? Date.parse(m.timestamp) : 0;
                break;
              }
            }
            // If no message with content, fallback to last message timestamp
            if (!lastMessage) {
              const m = chat.messages[chat.messages.length - 1];
              if (m && m.timestamp) lastTimestamp = Date.parse(m.timestamp);
            }
          } else if (chat && chat.last_message) {
            if (typeof chat.last_message.content === 'string' && chat.last_message.content.trim() !== '') {
              lastMessage = chat.last_message;
            }
            if (chat.last_message.timestamp) lastTimestamp = Date.parse(chat.last_message.timestamp);
          }
          group._lastMessage = lastMessage;
          group._lastTimestamp = lastTimestamp;
          group._isNew = !chat; // Mark as new if no chat exists
          return group;
        })
        .sort((a, b) => {
          // Sort by new matches first, then by _lastTimestamp descending (newest first)
          if (a._isNew && !b._isNew) return -1;
          if (!a._isNew && b._isNew) return 1;
          return (b._lastTimestamp || 0) - (a._lastTimestamp || 0);
        })
        .map((group, idx, arr) => {
          // Debug: log the order and timestamps
          if (idx === 0) {
            // Only log once per render
            console.log('Chat order debug:', arr.map(g => ({
              name: g.otherUser?.name || g.otherUser?.displayName,
              _lastTimestamp: g._lastTimestamp,
              _lastMessage: g._lastMessage,
              _isNew: g._isNew,
            })));
          }
          return (
            <ChatMatchCard
              key={group.matchIds.join('-')}
              match={group}
              isUnread={group.isUnread}
              onChat={handleChatClick}
              onViewProfile={handleViewProfile}
              lastMessage={group._lastMessage}
              currentUserId={user?.uid}
            />
          );
        })}
    </div>
  );
}

export default Chats;
