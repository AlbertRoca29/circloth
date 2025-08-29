import React from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "../utils/general";
import { CATEGORIES } from "../constants/categories";
import "../styles/buttonStyles.css";
import { height, maxHeight } from "@mui/system";

function ItemDetailModal({
  item,
  open,
  onClose,
  currentIdx = 0,
  setIdx,
  showNavigation = true,
  footer,
  matching = false,
}) {
  const { t } = useTranslation();
  // Always call hooks at the top
  const images = item ? (item.photoURLs || []) : [];
  const [modalIdx, setModalIdx] = React.useState(currentIdx);
  React.useEffect(() => {
    setModalIdx(currentIdx);
  }, [currentIdx, item]);
  const handlePrev = (e) => {
    e && e.stopPropagation();
    setModalIdx((modalIdx - 1 + images.length) % images.length);
  };
  const handleNext = (e) => {
    e && e.stopPropagation();
    setModalIdx((modalIdx + 1) % images.length);
  };
  const getCategoryLabel = (catKey) => {
    const cat = CATEGORIES.find((c) => c.key === catKey);
    return cat ? t(cat.labelKey) : catKey;
  };
  // Minimal details only
  // More details dropdown
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  // Always call hooks before any return
  if (!item || !open) return null;
  const showSize = item.size && item.size !== 'other';
  const hasMoreDetails = !!(item.sizeDetails || item.material || item.additionalInfo);

  // Modal style: absolute (popup) or relative (inline)
  const modalWrapperStyle = matching
    ? {
        marginTop: "20%",
        marginLeft: "15%",
        width: '70vw',
        height: '70vh',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: 0,
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '95vw',
        height: '70vh',
        background: 'rgba(0,0,0,0.18)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      };
  const cardStyle = matching
    ? {
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 12px rgba(34,197,94,0.08)',
        padding: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        margin: 0,
      }
    : {
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(34,197,94,0.10)',
        padding: 0,
        width: '95vw',
        height: '70%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        margin: 0,
      };
  return (
    <div style={modalWrapperStyle}>
      <div style={cardStyle}>
        {/* Image section, takes most of the card */}
        {images.length > 0 && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '68%',
              minHeight: 260,
              background: '#f7f7f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTopLeftRadius: matching ? 10 : 12,
              borderTopRightRadius: matching ? 10 : 12,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              flexDirection: 'column',
              padding: 0,
            }}
          >
            {/* Progress bar for images */}
            {images.length > 1 && (
              <div style={{
                width: '100%',
                height: 6,
                background: '#e0e0e0',
                display: 'flex',
                flexDirection: 'row',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 3,
              }}>
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      background: idx === modalIdx ? '#1ecb7b' : 'transparent',
                      transition: 'background 0.2s',
                      borderRadius: idx === 0 ? '6px 0 0 6px' : idx === images.length - 1 ? '0 6px 6px 0' : 0,
                    }}
                  />
                ))}
              </div>
            )}
            {/* Minimalistic triangular SVG arrows */}
            {showNavigation && images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    borderRadius: 0,
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    color: '#222',
                    cursor: 'pointer',
                    zIndex: 2,
                    outline: 'none',
                  }}
                  aria-label="Previous image"
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" style={{display:'block'}}><polyline points="20,8 12,16 20,24" fill="none" stroke="#222" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    borderRadius: 0,
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    color: '#222',
                    cursor: 'pointer',
                    zIndex: 2,
                    outline: 'none',
                  }}
                  aria-label="Next image"
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" style={{display:'block'}}><polyline points="12,8 20,16 12,24" fill="none" stroke="#222" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </>
            )}
            <img
              src={images[modalIdx]}
              alt={`item-${modalIdx}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 0,
                display: 'block',
                background: 'transparent',
                transition: 'none',
                userSelect: 'none',
              }}
            />
          </div>
        )}
        {/* Minimal details section */}
        <div style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '18px 0px 0 20px',
          gap: 8,
          margin: "10px 0px 20px 20px"
        }}>
          {/* Category and emoji */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 18, fontWeight: 400, color: '#222' }}>
            <span>{getCategoryEmoji(item.category)}</span>
            <span style={{ fontSize: 15, color: '#444', fontWeight: 300 }}>{getCategoryLabel(item.category)}</span>
          </div>
          {/* Size and color */}
          {(showSize || item.color) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {showSize && (
                <span style={{
                  background: '#f2f2f2',
                  color: '#222',
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontWeight: 300,
                  fontSize: 13,
                  letterSpacing: 0.2,
                  display: 'inline-block',
                }}>
                  {t(item.size) !== item.size ? t(item.size) : item.size}
                </span>
              )}
              {item.color && (
                <span style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  background: item.color,
                  border: '1px solid #e0e0e0',
                  marginLeft: 2,
                  verticalAlign: 'middle',
                }} title={item.color}></span>
              )}
            </div>
          )}
          {/* Minimal description */}
          {item.itemStory && (
            <div style={{
              color: '#666',
              fontSize: 14,
              fontWeight: 300,
              marginTop: 2,
              marginBottom: 0,
              width: '100%',
              maxWidth: 340,
              lineHeight: 1.4,
              textAlign: 'left',
              background: 'none',
              padding: 0,
            }}>
              {item.itemStory}
            </div>
          )}
          {/* More details + button */}
          {hasMoreDetails && (
            <div style={{ width: '100%', maxWidth: 350, margin: '8px 0 0 0' }}>
              <button
                onClick={() => setDetailsOpen((v) => !v)}
                style={{
                  width: '100%',
                  background: '#f3f4f6',
                  color: '#444',
                  border: 'none',
                  borderRadius: 7,
                  padding: '7px 0',
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
                <span style={{ fontSize: 18 }}>{detailsOpen ? '▲' : '+'}</span>
              </button>
              {detailsOpen && (
                <div style={{
                  maxHeight: 90,
                  overflowY: 'auto',
                  marginTop: 6,
                  background: '#f9fafb',
                  borderRadius: 7,
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
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer (close button) */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px 0 18px 0',
          borderTop: '1px solid #f0f0f0',
          background: '#fff',
        }}>
          {footer ? footer : (
            <button
              onClick={onClose}
              style={{
                background: '#f5f5f5',
                color: '#222',
                border: 'none',
                borderRadius: 8,
                padding: '7px 18px',
                fontWeight: 400,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(34,197,94,0.07)',
                transition: 'background 0.18s',
              }}
              title={t('close')}
            >
              {t('close') || 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetailModal;
