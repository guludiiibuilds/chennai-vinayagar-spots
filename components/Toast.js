import React from "react";

const TONES = {
  success: { bg: "var(--navy-800)", accent: "var(--saffron-400)" },
  info: { bg: "var(--navy-800)", accent: "var(--blue-500)" },
  error: { bg: "var(--navy-800)", accent: "var(--color-error)" },
};

export function Toast({ tone = "success", children }) {
  const t = TONES[tone] || TONES.success;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10, background: t.bg, color: "#fff",
      padding: "13px 18px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-elevated)",
      fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.accent, flexShrink: 0 }} />
      {children}
    </div>
  );
}
