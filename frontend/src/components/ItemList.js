import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { storage } from "../utils/firebase";
import { ref, deleteObject } from "firebase/storage";
import BACKEND_URL from "../config";
import ItemDetailModal from "./ItemDetailModal";
import LoadingSpinner from "./LoadingSpinner";
import { fetchUserItems, fetchUserActions, syncItemsWithDB, syncActionsWithDB } from '../api/userItemsApi';
import { sendMatchAction, fetchLikedItems } from "../api/matchingApi";
import '../styles/buttonStyles.css';
import ConfirmDialog from './ConfirmDialog';
import { getItemsFromLocalStorage, setItemsToLocalStorage, clearLocalStorage, getActionsFromLocalStorage, setActionsToLocalStorage, clearActionsFromLocalStorage } from '../utils/general';

function DropdownMenu({ onEdit, onDelete, onClose, position }) {
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
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 100000,
      pointerEvents: 'none',
    }}>
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: position?.top || 60,
          left: position?.left || 60,
          background: "#fff",
          border: '1px solid #eee',
          borderRadius: 8,
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.12)',
          minWidth: 90,
          padding: '4px 0',
          fontSize: 15,
          zIndex: 999999,
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

function ItemList({ user, refreshSignal, onModalOpenChange,
  buttons = "edit_delete",
  from_user_matching = null,
  matching = false,
  only_likes = false,
  maxItems = null,
  onExpand = null,
  expanded = false,
  useLocalStorage = false
}) {
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
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [menuOpenId, setMenuOpenId] = useState(null); // For dropdown menu
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuItem, setMenuItem] = useState(null);
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
      try {
        if (useLocalStorage) {
          const cachedItems = getItemsFromLocalStorage(user.id);
          if (cachedItems) {
            setItems(cachedItems);
            return;
          }
        }
        const data = await fetchUserItems(user.id);
        setItems(data.items);
        if (useLocalStorage) {
          setItemsToLocalStorage(user.id, data.items);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, [user.id, refreshSignal, matching, from_user_matching, useLocalStorage]);


  useEffect(() => {
    if (matching) {
      const cachedActions = getActionsFromLocalStorage(user.id);
      if (Object.keys(cachedActions).length > 0) {
        setUserActions(cachedActions);
      } else {
        fetchLikedItems(user.id, from_user_matching.id)
          .then(likedItems => {
            const actionsMap = {};
            likedItems.forEach(item => {
              actionsMap[item.id] = true;
            });
            setUserActions(actionsMap);
            setActionsToLocalStorage(user.id, actionsMap);
          })
          .catch(err => {
            console.error("Error fetching liked items", err);
          });
      }
    }
  }, [buttons, user.id, from_user_matching === null ? null : from_user_matching.id]);

  useEffect(() => {
    const handlePageLoad = () => {
      const syncData = async () => {
        const syncedItems = await syncItemsWithDB(user.id, BACKEND_URL);
        setItems(syncedItems);

        if (matching) {
          const syncedActions = await syncActionsWithDB(user.id, BACKEND_URL);
          setUserActions(syncedActions);
        }
      };
      syncData();
    };
    window.addEventListener('load', handlePageLoad);
    return () => {
      window.removeEventListener('load', handlePageLoad);
    };
  }, []); // Runs only when the page is fully loaded

  const updateCachedActions = (updatedActions) => {
    setActionsToLocalStorage(user.id, updatedActions);
  };

  const handleDelete = async (item) => {
    setConfirmDialog({
      open: true,
      title: t('delete_item_title') || 'Delete Item',
      message: t('delete_item_confirm') || 'Are you sure you want to delete this item?',
      confirmText: t('delete') || 'Delete',
      cancelText: t('cancel') || 'Cancel',
      onConfirm: async () => {
        setConfirmDialog({ open: false });
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
          if (useLocalStorage) {
            const updatedItems = items.filter(i => i.id !== item.id);
            setItemsToLocalStorage(user.id, updatedItems);
            setItems(updatedItems);
          } else {
            // Delete item from backend
            const res = await fetchUserItems(user.id); // Replace with a delete function in userItemsApi if needed
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
              setItemsToLocalStorage(user.id, updatedItems);
              return updatedItems;
            });
          }
          // Item deleted successfully
        } catch (err) {
          // Error deleting item
          console.error("Error deleting item", err);
        }
        setDeletingId(null);
      },
      onCancel: () => setConfirmDialog({ open: false })
    });
  };

  const userLiked = (itemId) => {
    return userActions[itemId] === true;
  };

  // Update handleAction to use custom confirmation dialog
  const handleAction = async (item, action) => {
    if (action === "like" && userLiked(item.id)) {
      setConfirmDialog({
        open: true,
        title: t('remove_like_title') || 'Remove Like',
        message: t('remove_like_confirm') || 'Are you sure you want to remove this like?',
        confirmText: t('remove') || 'Remove',
        cancelText: t('cancel') || 'Cancel',
        onConfirm: async () => {
          setConfirmDialog({ open: false });
          await doAction(item, action);
        },
        onCancel: () => setConfirmDialog({ open: false })
      });
      return;
    } else if (action === "pass") {
      setConfirmDialog({
        open: true,
        title: t('pass_item_title') || 'Pass Item',
        message: t('pass_item_confirm') || 'Are you sure you want to pass on this item?',
        confirmText: t('pass') || 'Pass',
        cancelText: t('cancel') || 'Cancel',
        onConfirm: async () => {
          setConfirmDialog({ open: false });
          await doAction(item, action);
        },
        onCancel: () => setConfirmDialog({ open: false })
      });
      return;
    }
    await doAction(item, action);
  };

  // Helper for like/pass actions
  const doAction = async (item, action) => {
    try {
      await sendMatchAction(from_user_matching.id, item.id, action);
      setUserActions((prev) => {
        const updatedActions = { ...prev, [item.id]: action === "like" ? !prev[item.id] : false };
        updateCachedActions(updatedActions);
        return updatedActions;
      });
    } catch (e) {
      console.error("Error performing action", e);
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const aLiked = userLiked(b.id) ? 1 : 0;
    const bLiked = userLiked(a.id) ? 1 : 0;
    return aLiked - bLiked; // Sort liked items last
  });
  if( only_likes === false ){
    sortedItems.reverse();
  }

  const filteredItems = sortedItems.filter(item => !(matching && buttons!=='like_pass' && !userLiked(item.id)));

  // Limit items if maxItems is set and not expanded
  const itemsToShow = (maxItems && !expanded) ? filteredItems.slice(0, maxItems) : filteredItems;

  if (!items.length) {
    return (
      <p style={{ textAlign: 'center', color: '#13980cff', fontWeight: 150, fontSize: "1rem" }}>
        {/* {t('no_clothing_items_added_yet')} */}
      </p>
    );
  }

  return (
  <div style={{ width: "92%", margin: '0 auto', position: 'relative' }}>
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />
      {deletingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.55)',
          zIndex: 100001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <LoadingSpinner size={60} />
        </div>
      )}
      {!modalOpen && (
        <>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          width: "100%",
        }}>
          {itemsToShow.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: !userLiked(item.id) && only_likes===true ? 'none' : 'flex',
                border: userLiked(item.id) && only_likes===false && buttons!="like_pass" ? "2.5px solid #ff004cb4" : "1.5px solid #eaeaea",
                aspectRatio: 0.9,
                background: "#fff",
                borderRadius: 9,
                boxShadow: "0 1.5px 8px 0 rgba(0,0,0,0.04)",
                padding: 0,
                flexDirection: "column",
                alignItems: "stretch",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "box-shadow .15s, border .15s, opacity 0.45s cubic-bezier(.4,2,.6,1), transform 0.45s cubic-bezier(.4,2,.6,1)",
                opacity: 1,
                transform: 'translateY(0)',
                animation: 'itemListFadeIn 0.55s cubic-bezier(.4,2,.6,1) both',
                animationDelay: `${idx * 60}ms`,
              }}
              onClick={() => { setModalItem(item); setModalIdx(0); setModalOpen(true); }}
            >
      {/* Fade/slide-in animation keyframes */}
      <style>{`
        @keyframes itemListFadeIn {
          from {
            opacity: 0;
            transform: translateY(32px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
              {/* Main Image */}
              {item.photoURLs && item.photoURLs[0] && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: "75%",
                  background: '#f6f6f6',
                  overflow: 'hidden',
                  transition: 'transform 0.25s ease-in-out',
                  cursor: 'pointer',
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
                    }}
                  />
                </div>
              )}
              {/* Info and actions row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px 7px 11px',
                background: 'rgba(255,255,255,0.98)',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                position: 'relative',
                zIndex: 2
              }}>
                {/* Left: Name and Size */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontWeight: 200,
                    fontSize: '0.8rem',
                    color: '#232323',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '30vw'
                  }}>{t(`short_${item.category}`) || t('item_name_placeholder') || 'Item'}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#888',
                    marginTop: 2
                  }}>{t('size')}: {t(item.size) || item.size || '-'}</span>
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
                          fontSize: '1.2rem',
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
                          fontSize: '1.15rem',
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
                ) : buttons === "edit_delete" && (
                  <div style={{ position: 'relative', marginLeft: 8 }}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPosition({
                          top: rect.bottom + window.scrollY,
                          left: rect.right - 120
                        });
                        setMenuOpenId(menuOpenId === item.id ? null : item.id);
                        setMenuItem(item);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.4rem',
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Expand/collapse button if maxItems is set and there are more items */}
        {maxItems && filteredItems.length > maxItems && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <button
              onClick={onExpand}
              style={{
                background: 'white',
                color: '#15803d',
                border: '1.5px solid #118a3d13',
                borderRadius: 8,
                padding: '6.5px 18px 6.5px 12px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                margin: '0 auto',
                boxShadow: expanded ? '0 2px 12px #22c55e33' : '0 1px 4px #0001',
                transition: 'box-shadow 0.25s cubic-bezier(.4,2,.6,1), background 0.18s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                outline: expanded ? '2px solid #22c55e55' : 'none',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{
                display: 'inline-block',
                transition: 'transform 0.32s cubic-bezier(.4,2,.6,1)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                marginRight: 4,
              }}>
                {/* Down arrow SVG */}
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 8.5L10 13L14.5 8.5" stroke="#15803d" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {expanded ? t('show_less') || 'Show less' : t('show_all') || 'Show all'}
            </button>
          </div>
        )}
        </>
      )}
      {/* DropdownMenu rendered at root for overlay */}
      {menuOpenId && menuItem && (
        <DropdownMenu
          onEdit={e => {
            e?.stopPropagation?.();
            setMenuOpenId(null);
            // Edit coming soon
          }}
          onDelete={e => {
            e?.stopPropagation?.();
            setMenuOpenId(null);
            handleDelete(menuItem);
          }}
          onClose={() => setMenuOpenId(null)}
          position={menuPosition}
        />
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
