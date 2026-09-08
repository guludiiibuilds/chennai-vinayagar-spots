"use client";

import React from "react";

const SIZES = {
  sm: { padding: "8px 16px", fontSize: "var(--text-button-size)", height: 36 },
  md: { padding: "12px 22px", fontSize: "var(--text-button-size)", height: 46 },
  lg: { padding: "15px 28px", fontSize: "17px", height: 54 },
};

const VARIANTS = {
  primary: { background: "var(--color-brand-primary)", color: "#fff", border: "1px solid transparent" },
  secondary: { background: "var(--color-brand-secondary)", color: "#fff", border: "1px solid transparent" },
  festive: { background: "var(--color-brand-accent)", color: "var(--navy-800)", border: "1px solid transparent" },
  outline: { background: "transparent", color: "var(--color-brand-secondary)", border: "1.5px solid var(--color-border-strong)" },
  ghost: { background: "transparent", color: "var(--color-brand-secondary)", border: "1px solid transparent" },
};

const HOVER = {
  primary: "var(--color-brand-primary-hover)",
  secondary: "var(--color-brand-secondary-hover)",
  festive: "var(--color-brand-accent-hover)",
  outline: "var(--cream-200)",
  ghost: "var(--cream-200)",
};

export function Button({ variant = "primary", size = "md", icon, iconRight, disabled, loading, children, onClick, style }) {
  const sizeStyle = SIZES[size] || SIZES.md;
  const variantStyle = VARIANTS[variant] || VARIANTS.primary;
  const [hover, setHover] = React.useState(false);
  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "var(--font-display)", fontWeight: "var(--text-button-weight)",
        letterSpacing: "var(--text-button-ls)", borderRadius: "var(--radius-button-pill)",
        cursor: disabled ? "not-allowed" : "pointer", transition: "background var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-out-soft)",
        opacity: disabled ? 0.45 : 1, transform: hover && !disabled ? "translateY(-1px)" : "none",
        ...sizeStyle, ...variantStyle,
        background: hover && !disabled ? HOVER[variant] : variantStyle.background,
        ...style,
      }}
    >
      {loading ? <Spinner /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "cv-spin 0.8s linear infinite" }}>
      <style>{"@keyframes cv-spin{to{transform:rotate(360deg)}}"}</style>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
