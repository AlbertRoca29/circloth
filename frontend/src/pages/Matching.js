import React, { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useTranslation } from "react-i18next";
import { fetchMatchItem, sendMatchAction } from "../api/matchApi";
import { fetchUserSizePreferences } from "../api/userApi";
import { fetchUserItems } from "../api/itemApi";
import ItemDetailModal from "../components/ItemDetailModal";
import LoadingSpinner from "../components/LoadingSpinner";
import SizeSelectionModal from "../components/SizeSelectionModal";
import "../styles/buttonStyles.css";

import { getItemsFromLocalStorage, setItemsToLocalStorage } from '../utils/localStorage';
import { SettingsIcon } from '../utils/svg';
import { ReactComponent as HeartIcon } from '../assets/heart.svg';
import { ReactComponent as CrossIcon } from '../assets/cross.svg';

function Matching({ user, setHasLocation }) {
  const { t } = useTranslation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [hasClothes, setHasClothes] = useState(false);
  const [showSizeSelection, setShowSizeSelection] = useState(false);
  const [filterBySize, setFilterBySize] = useState(false);
  const [sizePreferences, setSizePreferences] = useState({});

  // Fetch size preferences for user
  useEffect(() => {
    if (!user) {
      setSizePreferences({});
      return;
    }
    fetchUserSizePreferences(user.id || user.uid)
      .then(data => setSizePreferences(data || {}))
      .catch(() => setSizePreferences({}));
  }, [user, showSizeSelection]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

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
    // Check if user has clothes in localStorage first
    const cachedItems = getItemsFromLocalStorage(user.uid);
    if (cachedItems.length > 0) {
      setHasClothes(true);
    } else {
      fetchUserItems(user.uid)
        .then(data => {
          setHasClothes(data.items && data.items.length > 0);
          setItemsToLocalStorage(user.uid, data.items);
        })
        .catch(() => setHasClothes(false));
    }
  }, [user]);

  // Log when matching loads a large number of matches (potential memory usage)
  const loadNextItem = (filter = filterBySize) => {
    setLoading(true);
    setError(null);
    fetchMatchItem(user.uid, filter)
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
  }, [user, filterBySize]);

  const handleAction = async (action) => {
    if (!item) return;
    setActionLoading(true);
    try {
      await sendMatchAction(user.uid, item.id, action, item, item.ownerId);
      loadNextItem();
    } catch (e) {
      setError(e.message + (e.stack ? "\n" + e.stack : ""));
    } finally {
      setActionLoading(false);
    }
  };

  // Move hooks to top-level, before any early returns
//   const [swipeDir, setSwipeDir] = useState(null);
//   const [swipeAnim, setSwipeAnim] = useState(0); // px offset for animation
  const [swipeOffset, setSwipeOffset] = useState(0); // current drag offset

  const handleSwiping = (eventData) => {
    setSwipeOffset(eventData.deltaX); // follow finger horizontally
  };

  const handleSwiped = (eventData) => {
    if (eventData.dir === "Right") {
        setSwipeOffset(300); // animate out to right
        setTimeout(() => {
        setSwipeOffset(0);
        handleAction("like");
        }, 200);
    } else if (eventData.dir === "Left") {
        setSwipeOffset(-300); // animate out to left
        setTimeout(() => {
        setSwipeOffset(0);
        handleAction("pass");
        }, 200);
    } else {
        // reset if swipe wasn't strong enough
        setSwipeOffset(0);
    }
    };

//   const handleSwiped = (eventData) => {
//     if (eventData.dir === "Right") {
//       setSwipeDir("right");
//       setSwipeAnim(300);
//       setTimeout(() => {
//         setSwipeAnim(0);
//         setSwipeDir(null);
//         handleAction("like");
//       }, 200);
//     } else if (eventData.dir === "Left") {
//       setSwipeDir("left");
//       setSwipeAnim(-300);
//       setTimeout(() => {
//         setSwipeAnim(0);
//         setSwipeDir(null);
//         handleAction("pass");
//       }, 200);
//     }
//   };


  const handlers = useSwipeable({
    onSwiping: handleSwiping,
    onSwiped: handleSwiped,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

//   const handlers = useSwipeable({
//     onSwiped: handleSwiped,
//     preventDefaultTouchmoveEvent: true,
//     trackMouse: true,
//   });

  if (showSpinner) return <LoadingSpinner />;
  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '65vw',
    marginTop: '20vh',
    marginLeft: '11.5vw',
    whiteSpace: "pre-line",
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 4px 24px rgba(34,197,94,0.10)',
    padding: '5vh 6vw',
    fontSize: '0.95rem',
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
  if (item && !hasClothes) return (
    <div style={cardStyle}>
      {t('no_clothing_items_added_yet')}
    </div>
  );

  // Tinder-style card effect
  const tinderCardStyle = {
    // transition: swipeDir ? 'transform 0.2s cubic-bezier(.68,-0.55,.27,1.55)' : 'transform 0.5s',
    // transform: `translateX(${swipeAnim}px) rotate(${swipeAnim/10}deg)`,
    transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none',
    transform: `translateX(${swipeOffset}px) rotate(${swipeOffset / 10}deg)`,
    borderRadius: 18,
    margin: 'auto',
    padding: 0,
    position: 'relative',
    zIndex: 2,
  };

  const handleSizeSave = (sizes) => {
    setShowSizeSelection(false);
  };


  return (
    <div>
      {/* Only show filter and edit size preferences if sizePreferences is not empty */}
  <div style={{ margin: '6dvh 0 0 0',  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5vw'}}>
    {sizePreferences && Object.keys(sizePreferences).length > 0 && (
      <>
        <label style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
          <span style={{ fontSize: '0.9rem', fontFamily:'Geist', fontWeight:150, color: '#00721cbb' }}>{t('filter')}</span>
          <span style={{
            position: 'relative',
            display: 'inline-block',
            width: 42,
            height: 22,
            verticalAlign: 'middle',
          }}>
            <input
              type="checkbox"
              checked={filterBySize}
              style={{ opacity: 0, width: 0, height: 0 }}
              onChange={e => setFilterBySize(e.target.checked)}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: filterBySize ? '#22c55e' : '#e5e7eb',
                transition: 'background 0.2s',
                borderRadius: 22,
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  height: 17,
                  width: 17,
                  left: filterBySize ? 21 : 3,
                  bottom: 2.5,
                  background: '#fff',
                  transition: 'transform 0.2s, left 0.2s',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px #22c55e22',
                }}
              />
            </span>
          </span>
        </label>
        <div
          onClick={() => setShowSizeSelection(true)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            zIndex: 10,
            marginLeft: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            boxShadow: 'none',
          }}
          title={t('edit_size_preferences')}
        >
          <SettingsIcon size={28} style={{ color: '#106831ff' }} />
        </div>
      </>
    )}
  </div>

      {showSizeSelection && (
        <SizeSelectionModal
          onClose={() => setShowSizeSelection(false)}
          onSave={handleSizeSave}
          userId={user?.id || user?.uid}
        />
      )}
      {!item && hasClothes && (
            <div style={cardStyle}>
            {t('no_more_items')}
            </div>
        )}
      {item && hasClothes && (
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10vw', marginBottom: 0 }}>
              <button
                onClick={() => handleAction("pass")}
                disabled={actionLoading}
                className="common-button pass"
                title="Pass"
                style={{ fontSize: '1.8rem', borderRadius: '50%', width: 54, height: 54, boxShadow: '0 2px 8px #e11d4822', background: '#fff' }}
              >
                <CrossIcon width={32} height={32} style={{ color: '#15803d' }} />
              </button>
              <button
                onClick={() => handleAction("like")}
                disabled={actionLoading}
                className="common-button like"
                title="Like"
                style={{ fontSize: '1.8rem', borderRadius: '50%', width: 54, height: 54, boxShadow: '0 2px 8px #22c55e22', background: '#fff' }}
              >
                <HeartIcon width={32} height={32} style={{ color: '#15803d' }} />
              </button>
            </div>
          }
        />
      </div>
      )}
    </div>
  );
}

export default Matching;
