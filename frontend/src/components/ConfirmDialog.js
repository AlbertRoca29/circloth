import React from 'react';
function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = "OK", cancelText = "Cancel" }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      fontFamily: 'Geist',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.18)',
      zIndex: 100000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--gray-bg)',
        borderRadius: 16,
        boxShadow: '0 2px 16px 0 var(--shadow)',
        width: "65vw",
        padding: '28px 10px 18px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
  <div style={{ fontWeight: 200, fontSize: 18, marginBottom: 10, color: 'var(--text)', textAlign: 'center' }}>{title}</div>
  <div style={{ fontSize: 15, color: 'var(--gray-text)', marginBottom: 22, textAlign: 'center' }}>{message}</div>
        <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{
            background: 'var(--gray-border)', color: 'var(--text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 15, cursor: 'pointer', minWidth: 80
          }}>{cancelText}</button>
          <button onClick={onConfirm} style={{
            background: 'var(--danger)', color: 'var(--text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 15, cursor: 'pointer', minWidth: 80
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
export default ConfirmDialog;
