


import React, { useEffect, useState } from "react";
import { fetchMatchItem, sendMatchAction } from "./matchingApi";
import { getCategoryEmoji } from "./utils/general";


function Matching({ user }) {
  // Prevent body scroll when Matching is mounted
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

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
      // Collect device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: { width: window.screen.width, height: window.screen.height },
      };
      await sendMatchAction(user.uid, item.id, action, deviceInfo);
      loadNextItem();
    } catch (e) {
      setError(e.message + (e.stack ? "\n" + e.stack : ""));
    } finally {
      setActionLoading(false);
    }
  };


  if (loading) return <div className="card">Loading item...</div>;
  if (error) return <div className="card" style={{ color: "#e11d48" }}>Error: {error}</div>;
  if (!item) return <div className="card">No more items to show. Check back later!</div>;

  // Only one image at a time, with navigation
  const images = item.photoURLs || [];
  const categoryNames = {
    "tops": "Tops",
    "jackets_sweaters": "Jackets & Sweaters",
    "pants_shorts": "Pants & Shorts",
    "dresses_skirts": "Dresses & Skirts",
    "shoes": "Shoes",
    "accessories": "Accessories",
    "other": "Other"
  };

  return (
    <div
      className="card matching-card-fixed"
      style={{
        maxWidth: 420,
        margin: "0 auto",
        overflow: "hidden",
        maxHeight: '100%',
        borderRadius: 22,
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.09)",
        padding: 0,
        position: 'relative',
        top: 0,
      }}
    >
      {/* Single image with navigation */}
      {images.length > 0 && (
        <div style={{ width: '100%', height: 270, background: '#f6f6f6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: 0 }}>
          <img
            src={images[imgIdx]}
            alt={item.category}
            style={{
              height: '90%',
              width: 'auto',
              maxWidth: 320,
              objectFit: 'contain',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              background: '#f6f6f6',
              display: 'block',
            }}
            onTouchStart={e => (window._touchStartX = e.touches[0].clientX)}
            onTouchEnd={e => {
              const dx = e.changedTouches[0].clientX - window._touchStartX;
              if (dx > 40 && images.length > 1) setImgIdx(i => (i - 1 + images.length) % images.length);
              if (dx < -40 && images.length > 1) setImgIdx(i => (i + 1) % images.length);
            }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                style={{
                  position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', zIndex: 2
                }}
                aria-label="Previous image"
              >&#8592;</button>
              <button
                onClick={() => setImgIdx(i => (i + 1) % images.length)}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', zIndex: 2
                }}
                aria-label="Next image"
              >&#8594;</button>
              <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '2px 10px', fontSize: 13 }}>
                {imgIdx + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
      {/* Info row: emoji, category, color, size, distributed horizontally */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', gap: 8, padding: '8px 4px 0 4px', minHeight: 38, width: '100%' }}>
        <span style={{ fontSize: 22, display: 'flex', alignItems: 'center', gap: 4 }}>
          {getCategoryEmoji(item.category)}
          <span style={{
            fontSize: 12,
            color: '#444',
            fontWeight: 150,
            maxWidth: 70,
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            lineHeight: 1.1,
            textAlign: 'left',
            display: 'inline-block',
          }}>
            {categoryNames[item.category] || item.category}
          </span>
        </span>
        {item.color && item.color.trim() && (
          <span
            style={{
              display: 'inline-block',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: item.color,
              border: '2.5px solid #eee',
            }}
            title={item.color}
          ></span>
        )}
        {item.size && (
          <span style={{
            fontWeight: 100,
            fontSize: 15,
            background: '#f3f3f3',
            borderRadius: 8,
            padding: '2px 10px',
            color: '#444',
          }}>{item.size}</span>
        )}
      </div>
      {/* Yellow story box */}
      {item.itemStory && (
        <div style={{
          margin: '14px 10px 0 10px',
          background: '#fffbe6',
          borderRadius: 8,
          padding: '8px 10px',
          color: '#eab308',
          fontWeight: 100,
          fontSize: 15,
          minHeight: 30,
          display: 'flex',
          alignItems: 'center',
        }}>
          <span style={{ marginRight: 8, fontSize: 18 }}>📝</span>
          {item.itemStory}
        </div>
      )}
      {/* Dropdown for extra details */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 6 }}>
        <button
          onClick={() => setShowDetails(v => !v)}
          style={{
            background: '#f3f3f3',
            color: '#444',
            border: 'none',
            borderRadius: 8,
            padding: '4px 16px',
            fontSize: 15,
            cursor: 'pointer',
            marginBottom: 0,
            marginTop: 0,
            fontWeight: 100,
          }}
        >
          {showDetails ? 'Hide details ▲' : 'Show details ▼'}
        </button>
      </div>
      {showDetails && (
        <div style={{ width: '100%', padding: '16px 18px 0 18px', fontSize: 15, color: '#444', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100 }}>
          {item.brand && <div><strong>Brand:</strong> {item.brand}</div>}
          {item.material && <div><strong>Material:</strong> {item.material}</div>}
          {item.sizeDetails && <div><strong>Size details:</strong> {item.sizeDetails}</div>}
          {item.additionalInfo && <div><strong>Info:</strong> {item.additionalInfo}</div>}
        </div>
      )}
      {/* Pass/Like icons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 38, margin: '18px 0 8px 0', alignItems: 'center' }}>
        <button
          onClick={() => handleAction("pass")}
          disabled={actionLoading}
          style={{
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 56,
            height: 56,
            fontSize: 30,
            color: '#e11d48',
            boxShadow: '0 2px 8px rgba(225,29,72,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
          }}
          title="Pass"
        >
          <span role="img" aria-label="pass">❌</span>
        </button>
        <button
          onClick={() => handleAction("like")}
          disabled={actionLoading}
          style={{
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 56,
            height: 56,
            fontSize: 30,
            color: '#a259e6',
            boxShadow: '0 2px 8px rgba(162,89,230,0.13)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
          }}
          title="Like"
        >
          <span role="img" aria-label="like">❤️</span>
        </button>
      </div>
    </div>
  );
}

export default Matching;
