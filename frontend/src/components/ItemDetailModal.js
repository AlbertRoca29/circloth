import React from "react";
import { ArrowLeftIcon, ArrowRightIcon, ChevronRightIcon } from "../utils/svg";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "../utils/general";
import { CATEGORIES } from "../constants/categories";
import "../styles/buttonStyles.css";

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
        marginTop: "15vh",
        background: 'transparent',
        marginLeft: "0%",
        width: '100vw',
        height: '72.5vh',
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
        width: '100vw',
        height: '100vh',
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
        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.13)',
        padding: 0,
        width: '90%',
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
        width: '85vw',
        height: '75vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        margin: 0,
      };
  return (
    <div style={{ ...modalWrapperStyle, fontFamily: 'Geist' }}>
      <div style={cardStyle}>
        {/* Image section, takes most of the card */}
        {images.length > 0 && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '69%',
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
                  <ArrowLeftIcon />
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
                  <ArrowRightIcon />
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
          width: '90%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: 8,
          margin: "20px 0px 20px 0px"
        }}>
          {/* Category and emoji */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 18, fontWeight: 400, color: '#222' }}>
            <span style={{ fontSize: 15, color: '#000000ff', opacity: 0.75, fontWeight: 200 }}>{getCategoryLabel(item.category)}</span>
            <span>{getCategoryEmoji(item.category)}</span>
          </div>
          {/* Size */}
          {showSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                color: '#000000ff',
                fontWeight: 120,
                fontSize: 13,
                opacity: 0.65,
                letterSpacing: 0.2,
                display: 'inline-block',
              }}>
                <strong style={{ fontWeight: 170 }}>Size:</strong> {t(item.size) || item.size}
              </span>
            </div>
          )}
      {/* Minimal description */}
      {item.itemStory && (
      <div style={{
        color: item.color
          ? `color-mix(in srgb, ${item.color} 70%, ${(() => {
              const c = item.color.replace('#','');
              const a = [...c].reduce((sum, _, i, arr) => i % 2 ? sum + parseInt(arr[i-1]+arr[i], 16) : sum, 0) / (255*3);

              return a < 0.5 ? '#fff' : '#232323ff';
            })()} 30%)`
          : '#8e8e8eff',
        fontSize: 13.5,
        letterSpacing: 0.6,
        fontStyle: 'italic',
        marginTop: 6,
        lineHeight: 1.5,
        borderLeft: '2px solid #eee',
        paddingLeft: 8,
        fontFamily: "'Georgia', serif",
      }}>
        {item.itemStory}
      </div>
      )}
          {/* More details + button */}
          {hasMoreDetails && (
            <div style={{ width: '100%', margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div
                onClick={() => setDetailsOpen((v) => !v)}
                style={{
                  width: 'fit-content',
                  color: '#222',
                  fontWeight: 120,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  userSelect: 'none',
                  padding: 0,
                  marginBottom: 4,
                  border: 'none',
                  background: 'none',
                  fontFamily: 'inherit',
                  letterSpacing: 0.1,
                  outline: 'none',
                  marginLeft: 8,
                }}
                aria-expanded={detailsOpen}
                tabIndex={0}
                role="button"
              >
                {t('more_details') || 'More details'}
                <span style={{
                  display: 'inline-block',
                  transition: 'transform 0.2s',
                  transform: detailsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  marginLeft: 6,
                  marginBottom: 0,
                }}>
                  <ChevronRightIcon />
                </span>
              </div>
              {detailsOpen && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', gap: 10 }}>
                  <div style={{
                    width: 3,
                    height: '100%',
                    background: '#e0e0e0',
                    borderRadius: 3,
                    marginTop: 5,
                    marginLeft: 10,
                  }} />
                  <div style={{
                    maxHeight: 120,
                    overflowY: 'auto',
                    marginTop: 6,
                    padding: 0,
                    fontSize: 13,
                    color: '#000',
                    background: 'none',
                    border: 'none',
                    boxShadow: 'none',
                    borderRadius: 0,
                    animation: 'fadeIn 0.18s',
                    marginLeft: 8,
                    opacity: 0.65,
                    flex: 1,
                    display:'flex',
                    flexDirection: 'column',
                    rowGap: 9
                  }}>
                    {item.sizeDetails && (
                      <div style={{  }}>
                        <strong style={{ fontWeight: 150 }}>{t('size_details') || 'Size details'}:</strong> {item.sizeDetails}
                      </div>
                    )}
                    {item.material && (
                      <div style={{  }}>
                        <strong style={{ fontWeight: 150 }}>{t('material')}:</strong> {item.material}
                      </div>
                    )}
                    {item.additionalInfo && (
                      <div style={{  }}>
                        <strong style={{ fontWeight: 150 }}>{t('additional_info')}:</strong><br />{item.additionalInfo}
                      </div>
                    )}
                  </div>
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
