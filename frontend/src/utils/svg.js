export const ArrowLeftIcon = (props) => (
  <svg width="32" height="32" viewBox="0 0 32 32" style={{display:'block'}} {...props}>
    {/* Main arrow */}
    <polyline points="20,8 12,16 20,24" fill="none" stroke="#222" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowRightIcon = (props) => (
  <svg width="32" height="32" viewBox="0 0 32 32" style={{display:'block'}} {...props}>
    {/* Main arrow */}
    <polyline points="12,8 20,16 12,24" fill="none" stroke="#222" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronRightIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M7 5L12 10L7 15" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UserIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const HeartIcon = (props) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

export const ChatIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const ChevronDownIcon = (props) => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{ marginLeft: "0.1em" }} {...props}>
    <path d="M5 8l5 5 5-5" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const MenuIcon = (props) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark, #15803d)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const GlobeIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark, #15803d)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <ellipse cx="12" cy="12" rx="10" ry="4" />
    <ellipse cx="12" cy="12" rx="4" ry="10" />
  </svg>
);

export const CloseIcon = (props) => (
  <svg
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    stroke="#fff"
    strokeWidth="1.7"
    strokeLinecap="round"
    {...props}
  >
    <line x1="4.6" y1="4.6" x2="13.4" y2="13.4" />
    <line x1="13.4" y1="4.6" x2="4.6" y2="13.4" />
  </svg>
);

export const BackIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="22" fill="#e0e0e0"/>
    <path d="M24 14L16 22L24 30" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
