import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { fetchMessages, sendMessage } from "../api/chatApi";
import ChatMatchCard from "../components/ChatMatchCard";
import ItemList from "../components/ItemList";
import { fetchMatches } from "../api/matchingApi";
import LoadingSpinner from '../components/LoadingSpinner';
import "../styles/buttonStyles.css";
import { CloseIcon, BackIcon } from '../constants/icons';
import { HeartIcon } from '../utils/svg';
// IoSend icon for send button


function Chats({ user }) {
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


  // Move handleViewProfile above its first usage
  const handleViewProfile = (user, yours=false) => {
    if (yours) {
      setviewingYourProfile(user);
    }
    else{
        setviewingTheirProfile(user);
    }
  };

  if (chattingWith && !viewingTheirProfile) {
    return (
         <div style={{ position: 'fixed', top: '12.5%', left: '5%', width: '90%', height: '75%', zIndex: 10, background: 'transparent', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist' }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <button
            onClick={() => setChattingWith(null)}
            aria-label="Go back"
            className="common-button go-back"
            style={{ background: 'none', border: 'none', cursor: 'pointer', top: 0, left: "85%", position: "absolute" }}
            >
              <CloseIcon />
        </button>
        </div>
        <div style={{ borderRadius: 18, display: 'flex', flexDirection: 'column', width: '100%', height: '90%', background: '#fff', boxShadow: '0 2px 16px #0001', position: 'relative' }}>
          {/* Name at the top */}
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', padding: '18px 24px 0 24px', background: '#f6f6f6', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
            <div style={{ fontWeight: 500, fontSize: 18, color: '#15803d', flex: 1, textAlign: 'left' }}>
              {chattingWith.otherUser.name || chattingWith.otherUser.displayName}
            </div>
          </div>
          {/* Button below name */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '13px 24px 15px 24px', background: '#f6f6f6', fontWeight: 150, borderBottom: '1px solid #e5e5e5' }}>
            <div
              onClick={() => handleViewProfile(chattingWith.otherUser)}
              style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 9, padding: '12px 18px', fontSize: 16, cursor: 'pointer', outline: 'none', display: 'inline-flex', alignItems: 'center', textAlign: 'center', userSelect: 'none', gap: 8 }}
            >
              <HeartIcon style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('look_at_their_items', `Look at ${chattingWith.otherUser.name || chattingWith.otherUser.displayName || 'their'} Items`)}
            </div>
          </div>
          {/* Chat messages */}
          <div style={{ background: '#f6f6f6', borderRadius: 10, padding: 10, margin: 16, flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
          {/* Input area: input and send icon only, no button border/background */}
          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', padding: '0 18px 18px 18px', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('type_a_message', 'Type a message...')}
              style={{ flex: 1, borderRadius: 20, border: '1px solid #ddd', padding: '11px 16px', fontSize: 15.5, outline: 'none', background: '#fafafa' }}
              autoFocus
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



  if (viewingTheirProfile) {
    return (
      <div style={{ margin: '32% auto' }}>
        <button
          onClick={() => setviewingTheirProfile(null)}
          className="common-button go-back"
          style={{ top: "13.5vh", left: "6vw" }}
        >
            <BackIcon />

        </button>
        <ItemList
          user={viewingTheirProfile}
          onModalOpenChange={setItemListModalOpen}
          buttons="like_pass"
          matching={true}
          from_user_matching={user}
        />
      </div>
    );
  }
  if (viewingYourProfile) {
    console.log(chattingWith)
    return (
      <div style={{ margin: '30% auto'}}>
        <button
          onClick={() => setviewingYourProfile(null)}
          className="common-button go-back"
          style={{ top:60}}
        >
            <BackIcon />

        </button>

        <ItemList
          user={user}
          onModalOpenChange={setItemListModalOpen}
          buttons="none"
          matching={true}
          from_user_matching={viewingYourProfile}
        />
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
