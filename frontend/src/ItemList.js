import React, { useState, useEffect } from "react";
// import EditItemModal from "./EditItemModal";
import { useTranslation } from "react-i18next";
import { showToast } from "./utils/toast";
import { storage } from "./firebase";
import { ref, deleteObject } from "firebase/storage";
import BACKEND_URL from "./config";
import { getCategoryEmoji } from "./utils/general";
import { CATEGORIES, getSizeOptions } from "./utils/categories";

function ItemList({ user, refreshSignal }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [modalIdx, setModalIdx] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  // const [errorMsg, setErrorMsg] = useState("");
  // const [editModalItem, setEditModalItem] = useState(null);

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
  {/* Toast notifications will show errors instead of inline errorMsg */}

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
                <span style={{ fontSize: 24, marginRight: 2 }}>
                  {getCategoryEmoji(item.category)}
                </span>

                {item.color && item.color.trim() && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 15,
                      height: 15,
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

  {/* Edit Item Modal removed: edit functionality coming soon */}

      {/* Modal */}
      {modalOpen && modalItem && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 100,
          margin: "70px 70px 100px 70px",
          height: 650,
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
            maxWidth: 450,
            width: '100%',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            margin: 0,
          }}>


            {modalItem.photoURLs && modalItem.photoURLs.length > 0 && (
              <div style={{ position: 'relative', width: '100%', marginBottom: 16, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img
                  src={modalItem.photoURLs[modalIdx]}
                  alt={`item-${modalIdx}`}
                  loading="lazy"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 340,
                    borderRadius: 12,
                    display: 'block',
                    objectFit: 'contain',
                    background: '#f6f6f6',
                  }}
                />
                {modalItem.photoURLs.length > 1 && (
                  <>
                    <button
                      onClick={() => setModalIdx((modalIdx - 1 + modalItem.photoURLs.length) % modalItem.photoURLs.length)}
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        fontSize: 20,
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      aria-label="Previous image"
                    >&#8592;</button>
                    <button
                      onClick={() => setModalIdx((modalIdx + 1) % modalItem.photoURLs.length)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        fontSize: 20,
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      aria-label="Next image"
                    >&#8594;</button>
                    <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '2px 10px', fontSize: 13 }}>
                      {modalIdx + 1} / {modalItem.photoURLs.length}
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ marginBottom: 8 }}>
              <strong>{t('category')}:</strong> {getCategoryEmoji(modalItem.category)}{' '}
              <span style={{ fontSize: 13, color: '#444', fontWeight: 150 }}>
                {(() => {
                  const cat = CATEGORIES.find(c => c.key === modalItem.category);
                  return cat ? t(cat.labelKey) : modalItem.category;
                })()}
              </span>
            </div>

            {modalItem.size && (
              <div style={{ marginBottom: 8 }}>
                <strong>{t('size')}:</strong> {t(modalItem.size) !== modalItem.size ? t(modalItem.size) : modalItem.size}
              </div>
            )}
            {modalItem.material && (
              <div style={{ marginBottom: 8 }}>
                <strong>{t('material')}:</strong> {modalItem.material}
              </div>
            )}

            {modalItem.sizeDetails && (
              <div style={{ marginBottom: 8 }}>
                <strong>{t('details_of_size')}:</strong> {modalItem.sizeDetails}
              </div>
            )}

            {modalItem.additionalInfo && (
              <div style={{ marginBottom: 8 }}>
                <strong>{t('additional_info')}:</strong> {modalItem.additionalInfo}
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
                borderRadius: '50%',
                padding: 12,
                fontSize: 26,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.13)',
                transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
              }}
              title={t('close')}
            >
              <span role="img" aria-label="close">❌</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemList;
