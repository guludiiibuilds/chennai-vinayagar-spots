import React from "react";

export function SearchBar({ placeholder = "Search for a Vinayagar or area", value, onChange, onFilterClick }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, background: "var(--color-surface-elevated)",
      borderRadius: "var(--radius-pill)", padding: "12px 16px", boxShadow: "var(--shadow-card)",
      border: "1px solid var(--color-border-default)",
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" strokeLinecap="round"/></svg>
      <input value={value} onChange={onChange} placeholder={placeholder} style={{
        border: "none", outline: "none", flex: 1, fontFamily: "var(--font-body)", fontSize: "var(--text-body-size)", background: "transparent", color: "var(--color-text-primary)",
      }} />
      {onFilterClick && (
        <button onClick={onFilterClick} aria-label="Filters" style={{ border: "none", background: "var(--cream-200)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy-700)" strokeWidth="2"><path d="M4 6h16M8 12h8M11 18h2" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  );
}
