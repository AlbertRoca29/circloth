import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { showToast } from "../utils/toast";
import { storage } from "../utils/firebase";
import { ref, deleteObject } from "firebase/storage";
import BACKEND_URL from "../config";
import ItemDetailModal from "./ItemDetailModal";
import { getCategoryEmoji } from "../utils/general";
import { sendMatchAction, fetchLikedItems } from "../api/matchingApi";
import "../styles/buttonStyles.css";

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
    <div style={{ width: "90%", margin: '0 auto' }}>
      {!modalOpen && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 18,
          width: "100%",
        }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                border: userLiked(item.id) ? "10px solid #ff004cb4" : "none",
                aspectRatio: 1,
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
                transition: "box-shadow .15s"
              }}
              onClick={() => { setModalItem(item); setModalIdx(0); setModalOpen(true); }}
            >
              {/* Main Image */}
              { item.photoURLs && item.photoURLs[0] && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: "90%",
                  background: '#f6f6f6',
                  overflow: 'hidden',
                  transition: 'transform 0.25s ease-in-out',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                position: 'absolute',
                bottom: 0,
                width: '87%',
                padding: "0.5% 6% 4.6% 8%",
                background: 'linear-gradient(to top, rgba(80, 80, 80, 0), rgba(80, 80, 80, 0))',
                zIndex: 1,
                color: 'white',
                backdropFilter: 'blur(500px)',
                // WebkitBackdropFilter: 'blur(100px)'
              }}>
                <span style={{
                  fontSize: 30,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                }}>
                  {getCategoryEmoji(item.category)}
                </span>

                <div style={{ flex: 1 }}></div>
                {buttons && (buttons === "like_pass" ? (
                  <>
                    {!userLiked(item.id) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent click event from propagating to parent
                          handleAction(item, "like");
                        }}
                        className={`common-button like active small`}
                        title={t("like")}
                      >
                        <span role="img" aria-label="like">❤️</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent click event from propagating to parent
                          handleAction(item, "pass");
                        }}
                        className={`common-button pass small`}
                        title={t("pass")}
                      >
                        <span role="img" aria-label="pass">❌</span>
                      </button>
                    )}
                  </>
                ) : buttons === "edit_delete" ? (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); showToast(t('edit_coming_soon'), { type: 'info' }); }}
                      className="common-button edit small"
                      title={t('edit')}
                    >
                      <span role="img" aria-label="edit">✏️</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item); }}
                      disabled={deletingId === item.id}
                      className="common-button delete small"
                      title="Delete"
                    >
                      <span role="img" aria-label="delete">🗑️</span>
                    </button>
                  </>
                ) : null)}
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
