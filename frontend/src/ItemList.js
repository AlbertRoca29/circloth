import React, { useState, useEffect } from "react";
import { storage } from "./firebase";
import { ref, deleteObject } from "firebase/storage";
import BACKEND_URL from "./config";

function ItemList({ user, refreshSignal }) {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [modalIdx, setModalIdx] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    // Fetch items from backend
    fetch(`${BACKEND_URL}/items/${user.uid}`)
      .then(res => res.json())
      .then(data => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [user, refreshSignal]);

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this item?")) return;
    setDeletingId(item.id);
    try {
      // Delete images from storage
      if (item.photoURLs && Array.isArray(item.photoURLs)) {
        for (let i = 0; i < item.photoURLs.length; i++) {
          const url = item.photoURLs[i];
          try {
            // Extract path from URL
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
  const res = await fetch(`${BACKEND_URL}/item/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      setItems(items => items.filter(i => i.id !== item.id));
    } catch (err) {
      alert("Error deleting item");
    }
    setDeletingId(null);
  };

  if (!items.length) return <p>No clothing items added yet.</p>;

  return (
    <div>
  <h2 style={{ textAlign: "center", color: "var(--primary-dark, #15803d)", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "0.01em", fontFamily: 'Inter, Segoe UI, Arial, sans-serif', marginBottom: 24 }}>Your Clothing Items</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#f8fafc",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              padding: 18,
              display: "flex",
              alignItems: "center",
              gap: 18,
              position: "relative"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {item.photoURLs && item.photoURLs.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={item.name + "-" + idx}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: idx === 0 ? "2.5px solid var(--primary, #22c55e)" : "2px solid #ccc",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      setModalImages(item.photoURLs);
                      setModalIdx(idx);
                      setModalOpen(true);
                    }}
                    title={idx === 0 ? "Thumbnail" : "View image"}
                  />
                ))}
              </div>
              {item.photoURLs && item.photoURLs.length > 1 && (
                <span style={{ fontSize: 10, color: "var(--primary, #22c55e)" }}>Click to view</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: "#222", fontSize: 20 }}>{item.name}</h3>
              <div style={{ color: "#555", fontSize: 15, margin: "6px 0" }}>
                <span style={{ marginRight: 12 }}><strong>Category:</strong> {item.category}</span>
                <span><strong>Size:</strong> {item.size}</span>
              </div>
              <div style={{ color: "#555", fontSize: 15 }}>
                <span style={{ marginRight: 12 }}><strong>Color:</strong> {item.color}</span>
                {item.brand && <span style={{ marginRight: 12 }}><strong>Brand:</strong> {item.brand}</span>}
                {item.material && <span><strong>Material:</strong> {item.material}</span>}
              </div>
              {item.description && (
                <div style={{ color: "#888", fontSize: 14, marginTop: 6 }}>{item.description}</div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <button
                onClick={() => handleDelete(item)}
                disabled={deletingId === item.id}
                style={{
                  background: "#e53935",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 4
                }}
              >{deletingId === item.id ? "Deleting..." : "Delete"}</button>
              <button
                onClick={() => alert("Edit functionality coming soon!")}
                style={{
                  background: "var(--primary, #22c55e)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >Edit</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for image viewing */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{ position: "relative", background: "#fff", borderRadius: 10, padding: 20, minWidth: 320, minHeight: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={modalImages[modalIdx]}
              alt="modal"
              style={{ maxWidth: 400, maxHeight: 400, borderRadius: 8, display: "block", margin: "0 auto" }}
            />
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
              {modalImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={"thumb-" + idx}
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: idx === modalIdx ? "2.5px solid var(--primary, #22c55e)" : "2px solid #ccc",
                    cursor: "pointer"
                  }}
                  onClick={() => setModalIdx(idx)}
                />
              ))}
            </div>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "#e53935",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                fontSize: 18,
                cursor: "pointer"
              }}
              title="Close"
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ItemList;
