import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { showToast } from "./utils/toast";
import { storage } from "./firebase";
import { ref, deleteObject } from "firebase/storage";
import BACKEND_URL from "./config";
import ItemDetailModal from "./ItemDetailModal";
import { getCategoryEmoji } from "./utils/general";

function ItemList({ user, refreshSignal, onModalOpenChange }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  // Notify parent when modal open state changes
  useEffect(() => {
    if (onModalOpenChange) onModalOpenChange(modalOpen);
  }, [modalOpen, onModalOpenChange]);
  const [modalItem, setModalItem] = useState(null);
  const [modalIdx, setModalIdx] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (modalOpen) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
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
      showToast("Error deleting item", { type: "error" });
      console.error("Error deleting item", err);
    }

    setDeletingId(null);
  };

  if (!items.length) {
    return (
      <p style={{ textAlign: 'center', color: '#13980cff', fontWeight: 150,marginLeft:"9%", width: "400px", fontSize: "18px" }}>
        {t('no_clothing_items_added_yet')}
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      {!modalOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 19 }}>
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
                    loading="lazy"
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
                <span style={{ fontSize: 28, marginRight: 2, marginLeft: 4 }}>
                  {getCategoryEmoji(item.category)}
                </span>
                {item.color && item.color.trim() && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: item.color,
                      border: '1.5px solid #eee',
                      marginRight: 2,
                      marginLeft: 2
                    }}
                    title={item.color}
                  ></span>
                )}
                {item.size && item.size !== 'other' && (
                  <span style={{
                    fontWeight: 200,
                    fontSize: 15,
                    background: '#f3f3f3',
                    borderRadius: 8,
                    padding: '2px 8px',
                    color: '#444',
                    marginRight: 2
                  }}>{t(item.size) !== item.size ? t(item.size) : item.size}</span>
                )}
                <div style={{ flex: 1 }}></div>
                <button
                  onClick={e => { e.stopPropagation(); showToast(t('edit_coming_soon'), { type: 'info' }); }}
                  style={{
                    background: "#fff",
                    color: "#22c55e",
                    border: "none",
                    borderRadius: '50%',
                    padding: 8,
                    fontSize: 22,
                    cursor: "pointer",
                    marginLeft: 4,
                    marginRight: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
                  }}
                  title={t('edit')}
                >
                  <span role="img" aria-label="edit">✏️</span>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(item); }}
                  disabled={deletingId === item.id}
                  style={{
                    background: "#fff",
                    color: "#e11d48",
                    border: "none",
                    borderRadius: '50%',
                    padding: 8,
                    fontSize: 22,
                    cursor: "pointer",
                    marginLeft: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
                  }}
                  title="Delete"
                >
                  <span role="img" aria-label="delete">🗑️</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal using ItemDetailModal */}
      <ItemDetailModal
        item={modalItem}
        open={modalOpen && !!modalItem}
        onClose={() => setModalOpen(false)}
        currentIdx={modalIdx}
        setIdx={setModalIdx}
        showNavigation={true}
      />
    </div>
  );
}

export default ItemList;
