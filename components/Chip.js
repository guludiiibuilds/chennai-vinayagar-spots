"use client";

import React from "react";
import { Spinner } from "./Button";

export function Chip({ selected, icon, loading, onClick, children }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: "inline-flex", alignItems: "center", gap: 6, cursor: loading ? "default" : "pointer",
      padding: "9px 16px", borderRadius: "var(--radius-chip)",
      border: selected ? "1.5px solid var(--color-brand-primary)" : "1.5px solid var(--color-border-default)",
      background: selected ? "var(--vermillion-50)" : "var(--color-surface-elevated)",
      color: selected ? "var(--vermillion-700)" : "var(--color-text-secondary)",
      fontFamily: "var(--font-body)", fontSize: "var(--text-body-s-size)", fontWeight: 600,
      transition: "all var(--duration-fast) var(--ease-standard)",
      opacity: loading ? 0.7 : 1,
    }}>
      {loading ? <Spinner /> : icon}{children}
    </button>
  );
}
