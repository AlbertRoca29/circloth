import React from "react";
import { useTranslation } from "react-i18next";
import ChatMatchCard from "./ChatMatchCard";

// Simple modal for new match
function NewMatchModal({ match, onClose }) {
  const { t } = useTranslation();
  return (
    <div style={{
      background: 'var(--gray-bg)',
      borderRadius: 18,
      boxShadow: '0 8px 32px var(--shadow)',
      padding: '4vh 4vw',
      minWidth: 320,
      minHeight: 180,
      maxWidth: 420,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      position: 'relative',
    }}>
  <h2 style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 18 }}>{t('new_match', 'New match!')}</h2>
      <ChatMatchCard match={match} currentUserId={match?.yourItems?.[0]?.ownerId || match?.yourItem?.ownerId} />
      <button
        onClick={onClose}
        style={{
          marginTop: 24,
          background: 'var(--primary)',
          color: 'var(--text)',
          border: 'none',
          borderRadius: 8,
          padding: '10px 28px',
          fontSize: '1.1rem',
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 2px 8px var(--shadow)',
        }}
      >
        {t('close', 'Close')}
      </button>
    </div>
  );
}

export default NewMatchModal;
