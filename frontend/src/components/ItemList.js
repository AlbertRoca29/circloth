import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { showToast } from "../utils/toast";
import { storage } from "../utils/firebase";
import { ref, deleteObject } from "firebase/storage";
import BACKEND_URL from "../config";
import ItemDetailModal from "./ItemDetailModal";
import { getCategoryEmoji } from "../utils/general";
import { sendMatchAction, fetchLikedItems } from "../api/matchingApi";

import '../styles/buttonStyles.css';
// Minimal Dropdown Menu component
import { useRef, useCallback } from "react";

function DropdownMenu({ onEdit, onDelete, onClose }) {
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      pointerEvents: 'none',
    }}>
      <div
        ref={menuRef}
        style={{
          position: 'absolute',
          top: 'var(--dropdown-top, 60px)',
          left: 'var(--dropdown-left, 60px)',
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: 8,
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.12)',
          minWidth: 90,
          padding: '4px 0',
          fontSize: 15,
          zIndex: 99999,
          pointerEvents: 'auto',
        }}
      >
        <button onClick={onEdit} style={{
          background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '8px 16px', cursor: 'pointer', color: '#222'
        }}>Edit</button>
        <button onClick={onDelete} style={{
          background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '8px 16px', cursor: 'pointer', color: '#e00'
        }}>Delete</button>
      </div>
    </div>
  );
}

function ItemList({ user, refreshSignal, onModalOpenChange, buttons = "edit_delete", from_user_matching = null, matching = false }) {
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
  const [menuOpenId, setMenuOpenId] = useState(null); // For dropdown menu
  const [userActions, setUserActions] = useState({});

  // Disable body scroll when ItemDetailModal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo({ top: 0, behavior: "instant" });
      return () => { document.body.style.overflow = ''; };
    }
  }, [modalOpen]);

  useEffect(() => {
    const fetchItems = async () => {
        const cachedItems = localStorage.getItem(`items_${user.id}`);
        if (cachedItems && matching) {
            setItems(JSON.parse(cachedItems));
        } else {
            try {
                const response = await fetch(`${BACKEND_URL}/items/${user.id}`);
                const data = await response.json();
                setItems(data.items || []);
                localStorage.setItem(`items_${user.id}`, JSON.stringify(data.items || []));
            } catch (err) {
                setItems([]);
            }
        }
    };
    fetchItems();
}, [user, refreshSignal]);

  useEffect(() => {
    if (matching) {
      const cachedActions = localStorage.getItem(`actions_${user.id}`);
      if (false) {
        setUserActions(JSON.parse(cachedActions));
      } else {
        fetchLikedItems(user.id, from_user_matching.id)
          .then(likedItems => {
            const actionsMap = {};
            likedItems.forEach(item => {
              actionsMap[item.id] = true;
            });
            setUserActions(actionsMap);
            localStorage.setItem(`actions_${user.id}`, JSON.stringify(actionsMap));
          })
          .catch(err => {
            console.error("Error fetching liked items", err);
          });
      }
    }
  }, [buttons, user.id, from_user_matching === null ? null : from_user_matching.id]);

  const updateCachedActions = (updatedActions) => {
    localStorage.setItem(`actions_${user.id}`, JSON.stringify(updatedActions));
  };

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
            console.log(err)
          }
        }
      }
      console.log(item)

      // Delete item from backend
      const res = await fetch(`${BACKEND_URL}/item/${item.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete item");

      setItems(items => items.filter(i => i.id !== item.id));

      // Update cached actions
      setUserActions((prev) => {
        const updatedActions = { ...prev };
        delete updatedActions[item.id];
        updateCachedActions(updatedActions);
        return updatedActions;
      });

      // Update cached items in localStorage
      setItems((prevItems) => {
        const updatedItems = prevItems.filter(i => i.id !== item.id);
        localStorage.setItem(`items_${user.id}`, JSON.stringify(updatedItems));
        return updatedItems;
      });
    } catch (err) {
      showToast("Error deleting item", { type: "error" });
      console.error("Error deleting item", err);
    }

    setDeletingId(null);
  };

  const userLiked = (itemId) => {
    return userActions[itemId] === true;
  };

  // Update handleAction to include confirmation for already matched/passed items
  const handleAction = async (item, action) => {
    if (action === "like" && userLiked(item.id)) {
      if (!window.confirm("Are you sure you want to remove this like?")) {
        return;
      }
    } else if (action === "pass") {
      if (!window.confirm("Are you sure you want to pass on this item?")) {
        return;
      }
    }

    try {
      await sendMatchAction(from_user_matching.id, item.id, action);
      showToast(
        action === "like"
          ? userLiked(item.id)
            ? t("unliked_item")
            : t("liked_item")
          : t("passed_item"),
        {
          type: action === "like" && userLiked(item.id) ? "info" : "success",
        }
      );

      setUserActions((prev) => {
        const updatedActions = { ...prev, [item.id]: action === "like" ? !prev[item.id] : false };
        updateCachedActions(updatedActions);
        return updatedActions;
      });
    } catch (e) {
      showToast(t("error_handling_action"), { type: "error" });
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const aLiked = userLiked(a.id) ? 1 : 0;
    const bLiked = userLiked(b.id) ? 1 : 0;
    return bLiked - aLiked; // Sort liked items first
  });

  const filteredItems = sortedItems.filter(item => !(matching && buttons!=='like_pass' && !userLiked(item.id)));

  if (!items.length) {
    return (
      <p style={{ textAlign: 'center', color: '#13980cff', fontWeight: 150,marginLeft:"15%", width: "70%", fontSize: "16px" }}>
        {t('no_clothing_items_added_yet')}
      </p>
    );
  }

  return (
    <div style={{ width: "92%", margin: '0 auto' }}>
      {!modalOpen && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          width: "100%",
        }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                border: userLiked(item.id) ? "2.5px solid #ff004cb4" : "1.5px solid #eaeaea",
                aspectRatio: 1,
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 1.5px 8px 0 rgba(0,0,0,0.04)",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "box-shadow .15s, border .15s"
              }}
              onClick={() => { setModalItem(item); setModalIdx(0); setModalOpen(true); }}
            >
              {/* Main Image */}
              {item.photoURLs && item.photoURLs[0] && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: "68%",
                  background: '#f6f6f6',
                  overflow: 'hidden',
                  transition: 'transform 0.25s ease-in-out',
                  cursor: 'pointer',
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img
                    src={item.photoURLs[0]}
                    alt="main"
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16
                    }}
                  />
                </div>
              )}
              {/* Info and actions row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px 8px 12px',
                minHeight: 44,
                background: 'rgba(255,255,255,0.98)',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                position: 'relative',
                zIndex: 2
              }}>
                {/* Left: Name and Size */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontWeight: 500,
                    fontSize: 15,
                    color: '#232323',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 110
                  }}>{t(`category_${item.category}`) || t('item_name_placeholder') || 'Item'}</span>
                  <span style={{
                    fontSize: 13,
                    color: '#888',
                    marginTop: 2
                  }}>Size: {t(item.size) || item.size || '-'}</span>
                </div>
                {/* Right: Actions */}
                {buttons === "like_pass" ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!userLiked(item.id) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(item, "like");
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: 22,
                          color: '#ff004c',
                          padding: 4,
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'background .12s'
                        }}
                        title={t("like")}
                      >
                        ❤️
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(item, "pass");
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: 22,
                          color: '#bbb',
                          padding: 4,
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'background .12s'
                        }}
                        title={t("pass")}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ position: 'relative', marginLeft: 8 }}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        // Save button position for dropdown
                        const rect = e.currentTarget.getBoundingClientRect();
                        document.documentElement.style.setProperty('--dropdown-top', `${rect.bottom + window.scrollY}px`);
                        document.documentElement.style.setProperty('--dropdown-left', `${rect.right - 120}px`);
                        setMenuOpenId(menuOpenId === item.id ? null : item.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 22,
                        color: '#888',
                        padding: 4,
                        borderRadius: 8,
                        cursor: 'pointer',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background .12s'
                      }}
                      title={t('options')}
                    >
                      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>⋮</span>
                    </button>
                    {menuOpenId === item.id && (
                      <DropdownMenu
                        onEdit={e => {
                          e?.stopPropagation?.();
                          setMenuOpenId(null);
                          showToast(t('edit_coming_soon'), { type: 'info' });
                        }}
                        onDelete={e => {
                          e?.stopPropagation?.();
                          setMenuOpenId(null);
                          handleDelete(item);
                        }}
                        onClose={() => setMenuOpenId(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal using ItemDetailModal */}
      {modalOpen && !!modalItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
          <ItemDetailModal
            item={modalItem}
            open={true}
            onClose={() => setModalOpen(false)}
            currentIdx={modalIdx}
            setIdx={setModalIdx}
            showNavigation={true}
            footer={null}
          />
        </div>
      )}
    </div>
  );
}

export default ItemList;
