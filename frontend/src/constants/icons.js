import React from 'react';

export const CloseIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="22" fill="#e0e0e0"/>
    <line x1="15" y1="15" x2="29" y2="29" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round"/>
    <line x1="29" y1="15" x2="15" y2="29" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round"/>
  </svg>
);

export const BackIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="22" fill="#e0e0e0"/>
    <path
      d="M24 14L16 22L24 30"
      stroke="#15803d"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="16" y1="22" x2="30" y2="22"
      stroke="#15803d"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
);
