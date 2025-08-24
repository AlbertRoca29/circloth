import React from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "./utils/general";
import { CATEGORIES } from "./utils/categories";

function ItemDetailModal({
  item,
  open,
  matching=false,
  onClose,
  currentIdx = 0,
  setIdx,
  showNavigation = true,
  footer,
}) {
  const { t } = useTranslation();
  // Always call hooks at the top
  const images = item ? (item.photoURLs || []) : [];
  const [modalIdx, setModalIdx] = React.useState(currentIdx);
  React.useEffect(() => {
    setModalIdx(currentIdx);
  }, [currentIdx, item]);
  const handlePrev = () => setModalIdx((modalIdx - 1 + images.length) % images.length);
  const handleNext = () => setModalIdx((modalIdx + 1) % images.length);
  const getCategoryLabel = (catKey) => {
    const cat = CATEGORIES.find((c) => c.key === catKey);
    return cat ? t(cat.labelKey) : catKey;
  };
  // Dropdown for more details
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    // Check if there are any more details to show
    const hasMoreDetails = !!(item.sizeDetails || item.material || item.additionalInfo);
  if (!item || !open) return null;
  // Helper: show size only if not 'other'
  const showSize = item.size && item.size !== 'other';
  // Helper: color circle
  const colorCircle = item.color ? (
    <span style={{
      display: 'inline-block',
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: item.color,
      border: '1.5px solid #ddd',
      marginLeft: 10,
      verticalAlign: 'middle',
    }} title={item.color}></span>
  ) : null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.02)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      justifyContent: 'center',
      overflow: 'auto',
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
        {/* 0) Image with navigation */}
        {images.length > 0 && (
          <div style={{
            position: 'relative',
            width: 280,
            height: 280,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'transparent',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <img
              src={images[modalIdx]}
              alt={`item-${modalIdx}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 12,
                display: 'block',
                objectFit: 'contain',
                background: 'transparent',
                transition: 'none',
              }}
            />
            {showNavigation && images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
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
                    zIndex: 2,
                  }}
                  aria-label="Previous image"
                >&#8592;</button>
                <button
                  onClick={handleNext}
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
                    zIndex: 2,
                  }}
                  aria-label="Next image"
                >&#8594;</button>
                <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '2px 10px', fontSize: 13 }}>
                  {modalIdx + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* 1) Emoji category + name category */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 25, marginRight: 6 }}>
            {getCategoryEmoji(item.category)}
          </span>
          <span style={{ fontSize: 16, color: '#1c1c1cff', fontWeight: 200 }}>
            {getCategoryLabel(item.category)}
          </span>
        </div>

        {/* 2) Size (if not 'other') in box + color in circle (side by side) */}
        {(showSize || item.color) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            {showSize && (
              <div style={{
                background: '#eeeeeeff',
                color: '#262626ff',
                borderRadius: 8,
                padding: '5px 12px',
                fontWeight: 200,
                fontSize: 15,
                boxShadow: '0 1px 4px rgba(34,197,94,0.07)',
                display: 'inline-block',
              }}>
                {t(item.size) !== item.size ? t(item.size) : item.size}
              </div>
            )}
            {colorCircle}
          </div>
        )}

        {/* 3) Item Story */}
        {item.itemStory && (
          <div style={{
            marginBottom: 12,
            background: '#fffbe6',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#ca9a0aff',
            fontWeight: 100,
            width: '80%',
            maxWidth: 350,
          }}>
            <span style={{ marginRight: 6 }}><strong style={{ fontWeight: 170 }}>{t('item_story')}</strong><br /></span>
            {item.itemStory}
          </div>
        )}

        {/* 4) More details: Dropdown with scrollable content */}
        {hasMoreDetails && (
          <div style={{ width: '90%', maxWidth: 350, marginBottom: 10 }}>
            <button
              onClick={() => setDetailsOpen((v) => !v)}
              style={{
                width: '100%',
                background: '#f3f4f6',
                color: '#444',
                border: 'none',
                borderRadius: 8,
                padding: '8px 0',
                fontWeight: 500,
                fontSize: 15,
                cursor: 'pointer',
                marginBottom: 0,
                boxShadow: '0 1px 4px rgba(34,197,94,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.18s',
              }}
              aria-expanded={detailsOpen}
            >
              {t('more_details') || 'More details'}
              <span style={{ fontSize: 18 }}>{detailsOpen ? '▲' : '▼'}</span>
            </button>
            {detailsOpen && (
              <div style={{
                height: 80,
                overflowY: 'auto',
                marginTop: 6,
                background: '#f9fafb',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 15,
                color: '#444',
                boxShadow: '0 1px 4px rgba(34,197,94,0.07)',
              }}>
                {item.sizeDetails && (
                  <div style={{ marginBottom: 10 }}>
                    <strong style={{ fontWeight: 170 }}>{t('size_details') || 'Size details'}:</strong> {item.sizeDetails}
                  </div>
                )}
                {item.material && (
                  <div style={{ marginBottom: 10 }}>
                    <strong style={{ fontWeight: 170 }}>{t('material')}:</strong> {item.material}
                  </div>
                )}
                {item.additionalInfo && (
                  <div style={{ marginBottom: 10 }}>
                    <strong style={{ fontWeight: 170 }}>{t('additional_info')}</strong><br />{item.additionalInfo}
                  </div>
                )}
                {/* Add more fields here if needed */}
              </div>
            )}
          </div>
        )}

        {/* Footer (custom actions) */}
        <div style={{ marginTop: 18, width: '100%', display: 'flex', justifyContent: 'center', gap: 16 }}>
          {footer ? footer : (
            <button
              onClick={onClose}
              style={{
                background: '#ffadad4a',
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
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetailModal;
