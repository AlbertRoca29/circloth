import React, { useEffect, useState } from "react";
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
    fetch(`${BACKEND_URL}/items/${user.uid}`)
      .then(res => res.json())
      .then(data => setHasClothes(data.items && data.items.length > 0))
      .catch(() => setHasClothes(false));
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
      loadNextItem();
    } catch (e) {
      setError(e.message + (e.stack ? "\n" + e.stack : ""));
    } finally {
      setActionLoading(false);
    }
  };

  if (showSpinner) return <LoadingSpinner />;
  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '65vw',
    marginTop: '20vh',
    marginLeft: '12.5vw',
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

  // Use ItemDetailModal for the detailed view, always open
  return (
    <ItemDetailModal
      item={item}
      open={true}
      onClose={() => {}}
      currentIdx={imgIdx}
      setIdx={setImgIdx}
      matching={true}
      showNavigation={true}
      footer={
        <div style={{ display: 'flex', justifyContent: 'center', gap: 30 }}>
          <button
            onClick={() => handleAction("pass")}
            disabled={actionLoading}
            className="common-button pass"
            title="Pass"
          >
            <span role="img" aria-label="pass">❌</span>
          </button>
          <button
            onClick={() => handleAction("like")}
            disabled={actionLoading}
            className="common-button like"
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
