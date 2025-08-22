
import React, { useEffect, useState } from "react";
import { fetchMatchItem, sendMatchAction } from "./matchingApi";

function Matching({ user }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  return (
    <div className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
  <h2 style={{ color: "var(--primary-dark, #15803d)", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "0.01em", fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>Matching</h2>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <b>{item.category} {item.brand ? `- ${item.brand}` : ''}</b> <span style={{ color: "var(--gray-text, #64748b)", fontWeight: 500 }}>{item.size}{item.sizeDetails ? ` (${item.sizeDetails})` : ''}</span>
        {item.photoURLs && item.photoURLs.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <img src={item.photoURLs[0]} alt={item.category} style={{ width: 120, borderRadius: 8 }} />
          </div>
        )}
        <div style={{ color: "var(--gray-text, #64748b)", fontSize: 14, marginBottom: 12 }}>
          {item.itemStory}
          {item.color && <div><strong>Color:</strong> {item.color}</div>}
          {item.material && <div><strong>Material:</strong> {item.material}</div>}
          {item.additionalInfo && <div><strong>Info:</strong> {item.additionalInfo}</div>}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button className="btn gray" onClick={() => handleAction("pass")} disabled={actionLoading}>Pass</button>
          <button className="btn" onClick={() => handleAction("like")} disabled={actionLoading}>Like</button>
        </div>
      </div>
    </div>
  );
}

export default Matching;
