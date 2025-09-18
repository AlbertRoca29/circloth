import React from "react";
import { ReactComponent as ArrowLeftIcon } from '../assets/arrow-left.svg';
import { ReactComponent as ArrowRightIcon } from '../assets/arrow-right.svg';
import { ReactComponent as ChevronRightIcon } from '../assets/chevron-right.svg';
import { ReactComponent as CloseIcon } from '../assets/close.svg';
import { useTranslation } from "react-i18next";
import { CategoryIcon } from "../utils/general";
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
  const [objectFit, setObjectFit] = React.useState('cover');
  React.useEffect(() => {
    setModalIdx(currentIdx);
    setObjectFit('cover'); // Reset objectFit when changing image
  }, [currentIdx, item]);
  const handlePrev = (e) => {
    e && e.stopPropagation();
    setModalIdx((prevIdx) => {
      setObjectFit('cover');
      return (prevIdx - 1 + images.length) % images.length;
    });
  };
  const handleNext = (e) => {
    e && e.stopPropagation();
    setModalIdx((prevIdx) => {
      setObjectFit('cover');
      return (prevIdx + 1) % images.length;
    });
  };
  const getCategoryLabel = (catKey) => {
    const cat = CATEGORIES.find((c) => c.key === catKey);
    return cat ? t(cat.labelKey) : catKey;
  };
  // Minimal details only
  // More details dropdown
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  // Preload all images when modal opens
  React.useEffect(() => {
    if (open && images.length > 0) {
      images.forEach((url) => {
        const img = new window.Image();
        img.src = url;
      });
    }
  }, [open, images]);
  // Always call hooks before any return
  if (!item || !open) return null;
  const showSize = item.size && item.size !== 'other';
  const hasMoreDetails = !!(item.sizeDetails || item.material || item.additionalInfo);

  // Modal style: absolute (popup) or relative (inline)
  const modalWrapperStyle = matching
    ? {
        marginTop: "2vh",
        background: 'transparent',
        marginLeft: "0%",
        width: '100vw',
        height: '75.5dvh',
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
        height: '100dvh',
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
        padding: '0 0 1vh 0',
        width: '92%',
        height: '75dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        margin: 0,
      };

  // Updated the close button to be square with a green background to match the app style
  const closeButtonStyle = {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 34,
    height: 34,
    fontFamily: 'Geist',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#08a12cd0', // Green background to match app style
    border: 'none',
    borderRadius: 4, // Square with slight rounding
    cursor: 'pointer',
    zIndex: 20,
    outline: 'none',
    padding: 0,
    transition: 'background 0.18s, box-shadow 0.18s',
    userSelect: 'none',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  };

  const closeButtonHoverStyle = {
    background: '#17a566', // Darker green on hover
  };

  const closeIconStyle = {
    width: 18,
    height: 18,
    stroke: '#fff', // White icon for contrast
    strokeWidth: 1.7,
    strokeLinecap: 'round',
  };

  return (
    <div style={{ ...modalWrapperStyle, fontFamily: 'Geist' }}>
      <div style={cardStyle}>
        {/* Close 'X' button for non-matching modals */}
        {!matching && (
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.background = closeButtonHoverStyle.background}
            onMouseOut={(e) => e.currentTarget.style.background = closeButtonStyle.background}
            aria-label={t('close') || 'Close'}
            title={t('close') || 'Close'}
          >
            <CloseIcon width={18} height={18} />
          </button>
        )}
        {/* Image section, takes most of the card */}
        {images.length > 0 && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
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
        <div
                  role="button"
                  tabIndex={0}
                  onClick={handlePrev}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePrev(); } }}
                  style={{
                    position: 'absolute',
                    left: "5%",
                    top: '50%',
          transform: 'translateY(-50%)',
                    zIndex: 4,
                    width: 120,
                    height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
                    cursor: 'pointer',
                    // hit area is larger but visually unchanged
                    background: 'transparent',
                    padding: 0,
                    outline: 'none',
                  }}
                >
          <button
                    className="common-button"
                    style={{
            boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
            background: 'rgba(255, 255, 255, 0.5)',
            border: 'none',
            width: 45,
            height: 45,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            outline: 'none',
            transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
                    }}
                    aria-hidden="true"
                  >
                    <ArrowLeftIcon width={30} height={30} />
                  </button>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleNext}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNext(); } }}
                  style={{
                    position: 'absolute',
                    right: "5%",
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 4,
                    width: 120,
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    background: 'transparent',
                    padding: 0,
                    outline: 'none',
                  }}
                >
                  <button
                    className="common-button"
                    style={{
                      boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
                      background: 'rgba(255,255,255,0.5)',
                      border: 'none',
                      width: 45,
                      height: 45,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      outline: 'none',
                      transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
                    }}
                    aria-hidden="true"
                  >
                    <ArrowRightIcon width={30} height={30} />
                  </button>
                </div>
              </>
            )}
            <img
              src={images[modalIdx]}
              alt={`item-${modalIdx}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                borderRadius: 0,
                display: 'block',
                background: 'transparent',
                transition: 'none',
                userSelect: 'none',
                cursor: 'zoom-in',
              }}
              onClick={() => setObjectFit((prev) => prev === 'cover' ? 'contain' : 'cover')}
              title="Toggle image fit"
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
          gap: 4,
          margin: "1.5vh 1vw"
        }}>
          {/* Category and emoji */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '1.15rem', fontWeight: 400, color: '#222' }}>
            <span style={{ fontSize: '0.95rem', color: '#000000ff', opacity: 0.75, fontWeight: 200 }}>{getCategoryLabel(item.category)}</span>
            {/* <span style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)' }}>
                <CategoryIcon category={item.category} />
            </span> */}
          </div>
          {/* Size */}
          {showSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                color: '#000000ff',
                fontWeight: 120,
                fontSize: '0.825rem',
                opacity: 0.65,
                letterSpacing: 0.2,
                display: 'inline-block',
              }}>
                <strong style={{ fontWeight: 170 }}>{t('size')}:</strong> {t(item.size) || item.size}
              </span>
            </div>
          )}
      {/* Minimal description */}
      {item.itemStory && (
      <div style={{
        color: item.color
          ? `color-mix(in srgb, ${item.color} 75%, ${(() => {
              const c = item.color.replace('#','');
              const a = [...c].reduce((sum, _, i, arr) => i % 2 ? sum + parseInt(arr[i-1]+arr[i], 16) : sum, 0) / (255*3);
              return a < 0.5 ? '#fff' : '#232323ff';
            })()} 25%)`
          : '#8e8e8eff',
        fontSize: '0.85rem',
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
                  fontSize: '0.9rem',
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
                  <ChevronRightIcon width={18} height={18} />
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
                    fontSize: '0.8rem',
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
        {matching && (
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1vh 0 1vh 0',
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
                  fontSize: '0.95rem',
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
        )}
      </div>
    </div>
  );
}

export default ItemDetailModal;
