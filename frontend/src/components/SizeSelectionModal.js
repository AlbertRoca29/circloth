import React, { useState, useEffect } from 'react';
import { getSizeOptions } from '../utils/general';
import { CATEGORIES, SIZE_OPTIONS } from '../constants/categories';
import { useTranslation } from 'react-i18next';
import BACKEND_URL from '../config';
import { FONT_FAMILY } from '../constants/theme';

const SizeSelectionModal = ({ userId, onClose, onSave }) => {
  const { t } = useTranslation();
  const [selectedSizes, setSelectedSizes] = useState({});

  const rawSizeOptions = getSizeOptions(t);
  const sizeOptions = Object.fromEntries(
      Object.entries(rawSizeOptions).map(([cat, opts]) => [
      cat,
      opts.map(opt => ({ key: opt, label: opt }))
      ])
  );

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/user/${userId}/size_preferences`);
        const data = await response.json();
        setSelectedSizes(data);
      } catch (error) {
        console.error("Failed to fetch size preferences:", error);
      }
    };
    fetchPreferences();
  }, [userId]);

  const handleSizeToggle = (category, size) => {
    setSelectedSizes((prev) => {
      const currentSizes = prev[category] || [];
      const isSelected = currentSizes.includes(size);
      return {
        ...prev,
        [category]: isSelected
          ? currentSizes.filter((s) => s !== size)
          : [...currentSizes, size],
      };
    });
  };

  const handleSave = async () => {
    try {
      await fetch(`${BACKEND_URL}/user/${userId}/size_preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSizes),
      });
      onSave(selectedSizes);
    } catch (error) {
      console.error("Failed to save size preferences:", error);
    }
  };

  const modalStyles = {
    container: {
      fontFamily: FONT_FAMILY,
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    content: {
      background: 'linear-gradient(135deg, #ffffff, #f0f0f0)',
      borderRadius: '12px',
      width: '90vw',
      fontFamily: FONT_FAMILY,
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
      textAlign: 'left',
      position: 'relative',
      padding: 0,
    },
    headerBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#22c55e',
      padding: '13px 0 11px 0',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      position: 'relative',
    },
    headerTitle: {
      fontFamily: FONT_FAMILY,
      fontWeight: 150,
      fontSize: '1.1rem',
      color: '#fff',
      flex: 1,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    category: {
      marginBottom: '2.6vh',
    },
    grid: {
      display: 'grid',
      marginTop: '1.5vh',
      gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 17.5vw))',
      gap: '10px',
    },
    button: {
      padding: '9px',
      fontFamily: FONT_FAMILY,
      fontWeight: 100,
      border: '1px solid #ddd',
      borderRadius: '5px',
      background: '#f9f9f9',
      cursor: 'pointer',
      textAlign: 'center',
      fontSize: '0.85rem',
      transition: 'background 0.3s, transform 0.2s',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    buttonSelected: {
      background: '#22c55e',
      color: '#fff',
      borderColor: '#22c55e',
      transform: 'scale(1.05)',
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '30vw',
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '79.5vw',
      background: 'rgba(255,255,255,1)',
      padding: '1.75vh 5vw',
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      boxShadow: '0 -2px 8px rgba(0,0,0,0.07)',
    },
    actionButton: {
      padding: '1.75vh 0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontFamily: FONT_FAMILY,
      fontWeight: 175,
      fontSize: '1.05rem',
      width: '100%',
      transition: 'background 0.3s, color 0.3s',
    },
    skipButton: {
      background: 'none',
      border: '2px solid  #22c55e',
      color: ' #22c55e',
    },
    saveButton: {
      background: '#22c55e',
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
  };

  // Handler for select-all bubble
  const handleSelectAll = (categoryKey) => {
    const allSizes = SIZE_OPTIONS[categoryKey];
    setSelectedSizes((prev) => {
      // If all sizes are already selected, deselect all
      const alreadyAll = allSizes.every(size => prev[categoryKey]?.includes(size));
      return {
        ...prev,
        [categoryKey]: alreadyAll ? [] : [...allSizes],
      };
    });
  };

  // Style for select-all bubble
  const selectAllBubbleStyle = (allSelected) => ({
    display: 'inline-block',
    width: 17,
    height: 17,
    borderRadius: '50%',
    border: `1px solid ${allSelected ? '#22c55e' : '#bbb'}`,
    background: allSelected ? '#22c55e' : '#fff',
    marginLeft: 10,
    cursor: 'pointer',
    verticalAlign: 'middle',
    boxShadow: allSelected ? '0 0 0 2px #22c55e' : 'none',
    transition: 'background 0.2s, border 0.2s',
  });

  return (
    <div style={modalStyles.container}>
      <div style={modalStyles.content}>
        {/* Header Bar like Trade View */}
        <div style={modalStyles.headerBar}>
          <div style={modalStyles.headerTitle}>{t('select_sizes')}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '2vh 4vw 90px 4vw' }}>
          {CATEGORIES.map(({ key, labelKey }) => {
            const allSelected = SIZE_OPTIONS[key].every(size => selectedSizes[key]?.includes(size));
            return (
              <div key={key} style={modalStyles.category}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontWeight: 150, fontSize: '0.92rem', fontFamily: FONT_FAMILY, margin: 0 }}>{t(labelKey)}</h3>
                  <span
                    style={selectAllBubbleStyle(allSelected)}
                    onClick={() => handleSelectAll(key)}
                    title={allSelected ? t('deselect_all') : t('select_all')}
                  />
                </div>
                <div style={modalStyles.grid}>
                  {sizeOptions[key].map((size) => (
                    <button
                      key={size.key}
                      style={{
                        ...modalStyles.button,
                        ...(selectedSizes[key]?.includes(size.key) ? modalStyles.buttonSelected : {}),
                      }}
                      onClick={() => handleSizeToggle(key, size.key)}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* Fixed Action Buttons at Bottom */}
        <div style={modalStyles.actions}>
          <button
            onClick={onClose}
            style={{ ...modalStyles.actionButton, ...modalStyles.skipButton }}
          >
            {t('skip')}
          </button>
          <button
            onClick={handleSave}
            style={{ ...modalStyles.actionButton, ...modalStyles.saveButton }}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizeSelectionModal;
