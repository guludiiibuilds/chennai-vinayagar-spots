import React from "react";

const TONES = {
  verified: { bg: "var(--navy-700)", fg: "#fff" },
  pending: { bg: "var(--saffron-100)", fg: "var(--saffron-800)" },
  community: { bg: "var(--vermillion-100)", fg: "var(--vermillion-700)" },
  new: { bg: "var(--green-100)", fg: "var(--green-600)" },
  neutral: { bg: "var(--cream-200)", fg: "var(--navy-700)" },
};

export function Badge({ tone = "neutral", icon, children }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, background: t.bg, color: t.fg,
      borderRadius: "var(--radius-badge)", padding: "5px 10px", fontFamily: "var(--font-display)",
      fontSize: "var(--text-badge-size)", fontWeight: "var(--text-badge-weight)", letterSpacing: "var(--text-badge-ls)",
      textTransform: "uppercase", lineHeight: 1,
    }}>
      {icon}{children}
    </span>
  );
}
