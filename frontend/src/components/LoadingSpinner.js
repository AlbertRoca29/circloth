import React from 'react';
import { COLORS } from '../constants/theme';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'transparent'
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div className="spinner" style={{
        width: '50px',
        height: '50px',
        border: '5px solid #ccc',
        borderTop: `5px solid ${COLORS.appGreenDark}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{
        marginTop: '10px',
        fontSize: '16px',
        color: '#333'
      }}>Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
