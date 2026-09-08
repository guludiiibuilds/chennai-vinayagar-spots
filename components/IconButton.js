"use client";

import React from "react";

const SIZES = { sm: 32, md: 40, lg: 48 };
const VARIANTS = {
  filled: { background: "var(--color-brand-primary)", color: "#fff" },
  soft: { background: "var(--cream-200)", color: "var(--navy-700)" },
  outline: { background: "var(--color-surface-elevated)", color: "var(--navy-700)", border: "1px solid var(--color-border-default)" },
};

export function IconButton({ variant = "soft", size = "md", icon, label, onClick, style }) {
  const px = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.soft;
  return (
    <button aria-label={label} onClick={onClick} style={{
      width: px, height: px, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
      border: "none", cursor: "pointer", boxShadow: variant === "outline" ? "var(--shadow-sm)" : "none",
      transition: "transform var(--duration-fast) var(--ease-out-soft)", ...v, ...style,
    }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.94)"} onMouseUp={e => e.currentTarget.style.transform = "none"}>
      {icon}
    </button>
  );
}
