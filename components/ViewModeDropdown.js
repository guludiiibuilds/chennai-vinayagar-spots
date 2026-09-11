"use client";

import { useState } from "react";

const OPTIONS = [
  {
    value: "map",
    label: "Map",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" />
        <path d="M9 3v16M15 5v16" />
      </svg>
    ),
  },
  {
    value: "list",
    label: "List",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
];

export function ViewModeDropdown({ mode, onChange }) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === mode) || OPTIONS[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 14px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--line-strong)",
          background: "#ffffff",
          color: "var(--color-text-primary)",
          font: "700 13px var(--font-body)",
        }}
      >
        <span style={{ display: "flex", color: "var(--accent)" }}>{current.icon}</span>
        {current.label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--duration-fast) var(--ease-standard)" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 10,
              minWidth: 140,
              background: "#ffffff",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-card)",
              padding: 6,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: o.value === mode ? "var(--accent-tint)" : "transparent",
                  color: o.value === mode ? "var(--accent)" : "var(--color-text-primary)",
                  font: "700 13px var(--font-body)",
                  textAlign: "left",
                }}
              >
                {o.icon}
                {o.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
