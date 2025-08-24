import React from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "./utils/general";
import { CATEGORIES } from "./utils/categories";

function ItemDetailModal({
  item,
  open,
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
  if (!item || !open) return null;
  return (
    <div style={{
      position: 'fixed',
      height:'700px',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'transparent',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
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
        {/* Images with navigation */}
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
        {/* Category and emoji */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 22, marginRight: 6 }}>
            {getCategoryEmoji(item.category)}
          </span>
          <span style={{ fontSize: 16, color: '#444', fontWeight: 150 }}>
            {getCategoryLabel(item.category)}
          </span>
        </div>
        {item.size && (
          <div style={{ marginBottom: 8 }}>
            <strong style={{ fontWeight: 170 }}>{t('size')}:</strong> {t(item.size) !== item.size ? t(item.size) : item.size}
          </div>
        )}
        {item.sizeDetails && (
          <div style={{ marginBottom: 13 }}>
            {item.sizeDetails}
          </div>
        )}
        {item.material && (
          <div style={{ marginBottom: 8 }}>
            <strong style={{ fontWeight: 170 }}>{t('material')}:</strong> {item.material}
          </div>
        )}
        {item.additionalInfo && (
          <div style={{ marginBottom: 8 }}>
            <strong style={{ fontWeight: 170 }}>{t('additional_info')}</strong> <br /> {item.additionalInfo}
          </div>
        )}
        {item.itemStory && (
          <div style={{
            marginBottom: 8,
            background: '#fffbe6',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#ca9a0aff',
            fontWeight: 100,
          }}>
            <span style={{ marginRight: 6 }}><strong style={{ fontWeight: 170 }}>{t('item_story')}</strong><br /></span>
            {item.itemStory}
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
