import React, { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useTranslation } from "react-i18next";
import { fetchMatchItem, sendMatchAction } from "../api/matchingApi";
import ItemDetailModal from "../components/ItemDetailModal";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/buttonStyles.css";
import BACKEND_URL from "../config";
import { fontWeight } from "@mui/system";

function Matching({ user, setHasLocation }) {
  const { t } = useTranslation();
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [hasClothes, setHasClothes] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowSpinner(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!user) {
      setHasClothes(false);
      return;
    }
    // Fetch items from backend
    const cachedItems = localStorage.getItem(`items_${user.uid}`);
    if (cachedItems) {
      setHasClothes(JSON.parse(cachedItems).length > 0);
    } else {
      fetch(`${BACKEND_URL}/items/${user.uid}`)
        .then(res => res.json())
        .then(data => {
          setHasClothes(data.items && data.items.length > 0);
          localStorage.setItem(`items_${user.uid}`, JSON.stringify(data.items));
        })
        .catch(() => setHasClothes(false));
    }
  }, [user]);

  // Log when matching loads a large number of matches (potential memory usage)
  const loadNextItem = () => {
    setLoading(true);
    setError(null);
    fetchMatchItem(user.uid)
      .then((data) => setItem(data))
      .catch((e) => {
        setError(e.message + (e.stack ? "\n" + e.stack : ""));
        setItem(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNextItem();
    // eslint-disable-next-line
  }, [user]);

  const handleAction = async (action) => {
    if (!item) return;
    setActionLoading(true);
    try {
      await sendMatchAction(user.uid, item.id, action);
      const cachedItems = JSON.parse(localStorage.getItem(`items_${user.uid}`)) || [];
      const updatedItems = cachedItems.filter(cachedItem => cachedItem.id !== item.id);
      localStorage.setItem(`items_${user.uid}`, JSON.stringify(updatedItems));
      loadNextItem();
    } catch (e) {
      setError(e.message + (e.stack ? "\n" + e.stack : ""));
    } finally {
      setActionLoading(false);
    }
  };

  // Move hooks to top-level, before any early returns
  const [swipeDir, setSwipeDir] = useState(null);
  const [swipeAnim, setSwipeAnim] = useState(0); // px offset for animation

  const handleSwiped = (eventData) => {
    if (eventData.dir === "Right") {
      setSwipeDir("right");
      setSwipeAnim(300);
      setTimeout(() => {
        setSwipeAnim(0);
        setSwipeDir(null);
        handleAction("like");
      }, 200);
    } else if (eventData.dir === "Left") {
      setSwipeDir("left");
      setSwipeAnim(-300);
      setTimeout(() => {
        setSwipeAnim(0);
        setSwipeDir(null);
        handleAction("pass");
      }, 200);
    }
  };

  const handlers = useSwipeable({
    onSwiped: handleSwiped,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  if (showSpinner) return <LoadingSpinner />;
  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '65vw',
    marginTop: '20vh',
    marginLeft: '17.5vw',
    height: '35vh',
    whiteSpace: "pre-line",
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 4px 24px rgba(34,197,94,0.10)',
    padding: '32px 28px',
    fontSize: 16,
    fontWeight: 400,
    color: '#00721cff',
    fontWeight: 150,
    textAlign: 'center',
    fontFamily: 'Geist, sans-serif',
  };
  if (error) return (
    <div style={{...cardStyle, color: '#e11d48'}}>
      {t('error')}: {error}
    </div>
  );
  if (!item && hasClothes) return (
    <div style={cardStyle}>
      {t('no_more_items')}
    </div>
  );
  if (item && !hasClothes) return (
    <div style={cardStyle}>
      {t('no_clothing_items_added_yet')}
    </div>
  );

  // Tinder-style card effect
  const tinderCardStyle = {
    transition: swipeDir ? 'transform 0.2s cubic-bezier(.68,-0.55,.27,1.55)' : 'transform 0.5s',
    transform: `translateX(${swipeAnim}px) rotate(${swipeAnim/10}deg)`,
    borderRadius: 18,
    margin: 'auto',
    padding: 0,
    position: 'relative',
    zIndex: 2,
  };

  return (
    <div {...handlers} style={tinderCardStyle}>
      <ItemDetailModal
        item={item}
        open={true}
        onClose={() => {}}
        currentIdx={imgIdx}
        setIdx={setImgIdx}
        matching={true}
        showNavigation={true}
        footer={
          <div style={{ display: 'flex', justifyContent: 'center', gap: 36, marginBottom: 12 }}>
            <button
              onClick={() => handleAction("pass")}
              disabled={actionLoading}
              className="common-button pass"
              title="Pass"
              style={{ fontSize: 32, borderRadius: '50%', width: 60, height: 60, boxShadow: '0 2px 8px #e11d4822', background: '#fff' }}
            >
              <span role="img" aria-label="pass">❌</span>
            </button>
            <button
              onClick={() => handleAction("like")}
              disabled={actionLoading}
              className="common-button like"
              title="Like"
              style={{ fontSize: 32, borderRadius: '50%', width: 60, height: 60, boxShadow: '0 2px 8px #22c55e22', background: '#fff' }}
            >
              <span role="img" aria-label="like">❤️</span>
            </button>
          </div>
        }
      />
    </div>
  );
}

export default Matching;
