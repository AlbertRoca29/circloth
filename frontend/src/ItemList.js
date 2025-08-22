import React, { useState, useEffect } from "react";
import { storage } from "./firebase";
import { ref, deleteObject } from "firebase/storage";
import BACKEND_URL from "./config";

function ItemList({ user, refreshSignal }) {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [modalIdx, setModalIdx] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Expose modalOpen to parent via callback if provided
  useEffect(() => {
    if (typeof window.onItemListModalOpen === 'function') {
      window.onItemListModalOpen(modalOpen);
    }
  }, [modalOpen]);
  // Disable body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/items/${user.uid}`)
      .then(res => res.json())
      .then(data => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [user, refreshSignal]);

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this item?")) return;
    setDeletingId(item.id);

    try {
      // Delete images from Firebase Storage
      if (item.photoURLs && Array.isArray(item.photoURLs)) {
        for (let url of item.photoURLs) {
          try {
            const pathMatch = url.match(/\/o\/(.+)\?/);
            if (pathMatch && pathMatch[1]) {
              const path = decodeURIComponent(pathMatch[1]);
              await deleteObject(ref(storage, path));
            }
          } catch (err) {
            // Ignore individual image errors
          }
        }
      }

      // Delete item from backend
      const res = await fetch(`${BACKEND_URL}/item/${item.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete item");

      setItems(items => items.filter(i => i.id !== item.id));
    } catch (err) {
      setErrorMsg("Error deleting item");
      console.error("Error deleting item", err);
    }

    setDeletingId(null);
  };

  if (!items.length) {
    return (
      <p style={{ textAlign: 'center', color: '#9a9a9aff', fontWeight: 150 }}>
        No clothing items added yet.
      </p>
    );
  }

  const categoryEmoji = {
    "tops": "👕",
    "jackets_sweaters": "🧥",
    "pants_shorts": "👖",
    "dresses_skirts": "👗",
    "shoes": "👟",
    "accessories": "👜",
    "other": "✨"
  };

  return (
    <div style={{ maxWidth: 280, margin: '0 auto' }}>
      {errorMsg && (
        <div style={{
          color: 'var(--danger, #e11d48)',
          background: '#fff0f0',
          border: '1px solid var(--danger, #e11d48)',
          borderRadius: 6,
          padding: '8px 16px',
          marginBottom: 12,
          textAlign: 'center',
          fontWeight: 200
        }}>{errorMsg}</div>
      )}

      {/* Hide all items when modal is open */}
      {!modalOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 2px 12px 0 rgba(0,0,0,0.06)",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                border: "1.5px solid #f0f0f0",
                transition: "box-shadow .15s"
              }}
              onClick={() => { setModalItem(item); setModalIdx(0); setModalOpen(true); }}
            >
              {/* Main Image */}
              {item.photoURLs && item.photoURLs[0] && (
                <div style={{ position: 'relative', width: '100%', height: 180, background: '#f6f6f6' }}>
                  <img
                    src={item.photoURLs[0]}
                    alt="main"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px' }}>
                <span style={{ fontSize: 24, marginRight: 2 }}>
                  {categoryEmoji[item.category] || '👕'}
                </span>

                {item.color && item.color.trim() && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: item.color,
                      border: '1.5px solid #eee',
                      marginRight: 2
                    }}
                    title={item.color}
                  ></span>
                )}

                {item.size && (
                  <span style={{
                    fontWeight: 200,
                    fontSize: 13,
                    background: '#f3f3f3',
                    borderRadius: 8,
                    padding: '2px 8px',
                    color: '#444',
                    marginRight: 2
                  }}>{item.size}</span>
                )}

                <div style={{ flex: 1 }}></div>

                <button
                  onClick={e => { e.stopPropagation(); setErrorMsg("Edit functionality coming soon!"); }}
                  style={{
                    background: "#fff",
                    color: "#22c55e",
                    border: "1.2px solid #22c55e",
                    borderRadius: 8,
                    padding: "2px 8px",
                    fontWeight: 200,
                    cursor: "pointer",
                    fontSize: 12,
                    marginLeft: 4,
                    marginRight: 2
                  }}
                >Edit</button>

                <button
                  onClick={e => { e.stopPropagation(); handleDelete(item); }}
                  disabled={deletingId === item.id}
                  style={{
                    background: "#fff",
                    color: "#e11d48",
                    border: "1.2px solid #e11d48",
                    borderRadius: 8,
                    padding: "2px 8px",
                    fontWeight: 200,
                    cursor: "pointer",
                    fontSize: 12,
                    marginLeft: 2
                  }}
                >{deletingId === item.id ? "..." : "Delete"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && modalItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          height:600,
          background: 'transparent',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(34,197,94,0.13)',
            padding: '2.2rem 1.5rem',
            minWidth: 320,
            maxWidth: 380,
            width: '100%',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            margin: 0,
          }}>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 12, color: 'var(--primary-dark, #15803d)', textAlign: 'center' }}>
              {modalItem.brand || 'Clothing Item'}
            </div>

            {modalItem.photoURLs && modalItem.photoURLs[0] && (
              <img
                src={modalItem.photoURLs[0]}
                alt="main"
                style={{
                  width: '100%',
                  height: 180,
                  objectFit: 'cover',
                  borderRadius: 12,
                  marginBottom: 16
                }}
              />
            )}

            <div style={{ marginBottom: 8 }}>
              <strong>Category:</strong> {categoryEmoji[modalItem.category] || '👕'}
            </div>

            {modalItem.color && (
              <div style={{ marginBottom: 8 }}>
                <strong>Color:</strong>{" "}
                <span style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: modalItem.color,
                  border: '1.5px solid #eee',
                  verticalAlign: 'middle'
                }}></span>
              </div>
            )}

            {modalItem.size && (
              <div style={{ marginBottom: 8 }}>
                <strong>Size:</strong> {modalItem.size}
              </div>
            )}

            {modalItem.material && (
              <div style={{ marginBottom: 8 }}>
                <strong>Material:</strong> {modalItem.material}
              </div>
            )}

            {modalItem.sizeDetails && (
              <div style={{ marginBottom: 8 }}>
                <strong>Size details:</strong> {modalItem.sizeDetails}
              </div>
            )}

            {modalItem.additionalInfo && (
              <div style={{ marginBottom: 8 }}>
                <strong>Info:</strong> {modalItem.additionalInfo}
              </div>
            )}

            {modalItem.itemStory && (
              <div style={{
                marginBottom: 8,
                background: '#fffbe6',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#eab308',
                fontWeight: 100
              }}>
                <span style={{ marginRight: 6 }}>📝</span>
                {modalItem.itemStory}
              </div>
            )}

            <button
              onClick={() => setModalOpen(false)}
              style={{
                marginTop: 18,
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 24px',
                fontWeight: 200,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemList;
