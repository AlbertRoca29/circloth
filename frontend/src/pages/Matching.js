import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchMatchItem, sendMatchAction } from "../api/matchingApi";
import ItemDetailModal from "../components/ItemDetailModal";
import LoadingSpinner from "../components/LoadingSpinner";

function Matching({ user, setHasLocation }) {
  const { t } = useTranslation();
  // Location logic hidden for future release
  // const [hasLocation, setHasLocationLocal] = useState(true);
  // useEffect(() => {
  //   if (!navigator.geolocation) {
  //     setHasLocationLocal(false);
  //     setHasLocation && setHasLocation(false);
  //     return;
  //   }
  //   navigator.geolocation.getCurrentPosition(
  //     () => {
  //       setHasLocationLocal(true);
  //       setHasLocation && setHasLocation(true);
  //     },
  //     () => {
  //       setHasLocationLocal(false);
  //       setHasLocation && setHasLocation(false);
  //     },
  //     { timeout: 5000 }
  //   );
  // }, [user, setHasLocation]);
  // Prevent body scroll when Matching is mounted
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // Update user location when Matching tab is entered (hidden for future release)
  // useEffect(() => {
  //   if (!user || !user.uid) return;
  //   if (!navigator.geolocation) return;
  //   navigator.geolocation.getCurrentPosition(
  //     (pos) => {
  //       updateUserLocation(user.uid, pos.coords).catch(() => {});
  //     },
  //     () => {},
  //     { enableHighAccuracy: true, timeout: 10000 }
  //   );
  //   // Only on mount
  //   // eslint-disable-next-line
  // }, [user]);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowSpinner(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [loading]);

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

  if (showSpinner) return <LoadingSpinner />;
  if (error) return <div className="card" style={{ color: "#e11d48" }}>{t('error')}: {error}</div>;
  if (!item) return <div className="card">{t('no_more_items')}</div>;

  // Use ItemDetailModal for the detailed view, always open
  return (
    <ItemDetailModal
      item={item}
      open={true}
      matching={true}
      onClose={() => {}}
      currentIdx={imgIdx}
      setIdx={setImgIdx}
      showNavigation={true}
      footer={
        <div style={{ display: 'flex', justifyContent: 'center', gap: 30 }}>
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
      }
    />
  );
}

export default Matching;
