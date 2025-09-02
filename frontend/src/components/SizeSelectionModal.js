import React, { useState, useEffect } from 'react';
import { SIZE_OPTIONS, CATEGORIES } from '../constants/categories';
import { useTranslation } from 'react-i18next';
import BACKEND_URL from '../config';

const SizeSelectionModal = ({ userId, onClose, onSave }) => {
  const { t } = useTranslation();
  const [selectedSizes, setSelectedSizes] = useState({});

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
      fontWeight: 150,
      fontSize: 18,
      color: '#fff',
      flex: 1,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    category: {
      marginBottom: '0.5vh',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 18vw))',
      gap: '8px',
    },
    button: {
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      background: '#f9f9f9',
      cursor: 'pointer',
      textAlign: 'center',
      fontSize: '13.5px',
      transition: 'background 0.3s, transform 0.2s',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    buttonSelected: {
      background: 'var(--primary-dark, #15803d)',
      color: '#fff',
      borderColor: 'var(--primary-dark, #15803d)',
      transform: 'scale(1.05)',
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '30vw',
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '78vw',
      background: 'rgba(255,255,255,0.95)',
      padding: '2vh 6vw',
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      boxShadow: '0 -2px 8px rgba(0,0,0,0.07)',
    },
    actionButton: {
      padding: '2vh 0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: 18,
      width: '100%',
      transition: 'background 0.3s, color 0.3s',
    },
    skipButton: {
      background: 'none',
      border: '2px solid var(--primary-dark, #15803d)',
      color: 'var(--primary-dark, #15803d)',
      fontWeight: 600,
    },
    saveButton: {
      background: 'var(--primary-dark, #15803d)',
      color: '#fff',
      border: 'none',
      fontWeight: 600,
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
  };

  return (
    <div style={modalStyles.container}>
      <div style={modalStyles.content}>
        {/* Header Bar like Trade View */}
        <div style={modalStyles.headerBar}>
          <div style={modalStyles.headerTitle}>{t('select_sizes')}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '2vh 4vw 90px 4vw' }}>
          {CATEGORIES.map(({ key, labelKey }) => (
            <div key={key} style={modalStyles.category}>
              <h3 style={{ fontWeight: 150, fontSize: '15px' }}>{t(labelKey)}</h3>
              <div style={modalStyles.grid}>
                {SIZE_OPTIONS[key].map((size) => (
                  <button
                    key={size}
                    style={{
                      ...modalStyles.button,
                      ...(selectedSizes[key]?.includes(size) ? modalStyles.buttonSelected : {}),
                    }}
                    onClick={() => handleSizeToggle(key, size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
