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
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    content: {
      background: 'linear-gradient(135deg, #ffffff, #f0f0f0)',
      borderRadius: '16px',
      padding: '2vh 4vw',
      width: '82vw',
      maxHeight: '80%',
      overflowY: 'auto',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
      textAlign: 'left',
    },
    header: {
      textAlign: 'center',
      fontSize: '17px',
      marginBottom: '1vh',
      color: 'var(--primary-dark, #15803d)',
      fontWeight: '200',
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
      borderRadius: '6px',
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
      marginTop: '16px',
    },
    actionButton: {
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background 0.3s, color 0.3s',
    },
    skipButton: {
      background: 'none',
      border: '1px solid var(--primary-dark, #15803d)',
      color: 'var(--primary-dark, #15803d)',
    },
    saveButton: {
      background: 'var(--primary-dark, #15803d)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
  };

  return (
    <div style={modalStyles.container}>
      <div style={modalStyles.content}>
        <h2 style={modalStyles.header}>{t('select_sizes')}</h2>
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
