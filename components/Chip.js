"use client";

import React from "react";

export function Chip({ selected, icon, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
      padding: "9px 16px", borderRadius: "var(--radius-chip)",
      border: selected ? "1.5px solid var(--color-brand-primary)" : "1.5px solid var(--color-border-default)",
      background: selected ? "var(--vermillion-50)" : "var(--color-surface-elevated)",
      color: selected ? "var(--vermillion-700)" : "var(--color-text-secondary)",
      fontFamily: "var(--font-body)", fontSize: "var(--text-body-s-size)", fontWeight: 600,
      transition: "all var(--duration-fast) var(--ease-standard)",
    }}>
      {icon}{children}
    </button>
  );
}
