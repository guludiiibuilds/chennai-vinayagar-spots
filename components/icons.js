export function SearchIcon({ stroke = "var(--muted)", ...props }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" {...props}>
      <circle cx="11" cy="11" r="7"></circle>
      <path d="m20 20-3.5-3.5"></path>
    </svg>
  );
}

export function InfoIcon({ stroke = "var(--ink)", ...props }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9"></circle>
      <line x1="12" y1="11" x2="12" y2="16.5"></line>
      <circle cx="12" cy="7.5" r="1.1" fill={stroke} stroke="none"></circle>
    </svg>
  );
}

export function PinGlyph({ stroke = "#ffffff", ...props }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" {...props}>
      <path d="M12 3v3"></path>
      <path d="M7.5 20h9"></path>
      <path d="M6 20c0-4 2.7-7 6-7s6 3 6 7"></path>
      <circle cx="12" cy="8.5" r="2.2"></circle>
    </svg>
  );
}

export function CompassIcon({ stroke = "var(--accent)", ...props }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="3.2"></circle>
      <circle cx="12" cy="12" r="8"></circle>
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"></path>
    </svg>
  );
}

export function PhotoIcon({ stroke = "var(--line-strong)", ...props }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <circle cx="9" cy="10" r="1.7"></circle>
      <path d="m4 18 5.5-5 4 3.5L17 13l3 3"></path>
    </svg>
  );
}

export function BackIcon({ stroke = "var(--ink)", ...props }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" {...props}>
      <path d="m14 6-6 6 6 6"></path>
    </svg>
  );
}

export function CloseIcon({ stroke = "var(--ink)", ...props }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6 6 18"></path>
    </svg>
  );
}

export function ShareIcon({ stroke = "var(--ink)", ...props }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" {...props}>
      <path d="M12 3v11"></path>
      <path d="m8 7 4-4 4 4"></path>
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"></path>
    </svg>
  );
}

export function CheckIcon({ stroke = "var(--green)", ...props }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" {...props}>
      <path d="m5 13 4 4 10-10"></path>
    </svg>
  );
}

export function NavigateIcon({ stroke = "#ffffff", ...props }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.3" strokeLinecap="round" {...props}>
      <path d="M3 11 22 2l-9 19-2-8-8-2Z"></path>
    </svg>
  );
}

export function PlusIcon({ stroke = "#ffffff", ...props }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14"></path>
    </svg>
  );
}

export function PinPlaceIcon({ stroke = "var(--muted)", ...props }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" {...props}>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"></path>
      <circle cx="12" cy="10" r="2.4"></circle>
    </svg>
  );
}

export function ListIcon({ stroke = "var(--ink-soft)", ...props }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" {...props}>
      <circle cx="4.5" cy="6" r="1"></circle>
      <circle cx="4.5" cy="12" r="1"></circle>
      <circle cx="4.5" cy="18" r="1"></circle>
      <path d="M9 6h11M9 12h11M9 18h11"></path>
    </svg>
  );
}

export function ExternalLinkIcon({ stroke = "currentColor", ...props }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <path d="M15 3h6v6"></path>
      <path d="M10 14 21 3"></path>
    </svg>
  );
}
