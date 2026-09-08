import React from "react";

export function ListingCard({ image, title, area, distance, tone = "verified", compact }) {
  return (
    <div style={{
      background: "var(--color-surface-elevated)", borderRadius: "var(--radius-card)", overflow: "hidden",
      boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border-default)", width: compact ? "100%" : 260,
    }}>
      <div style={{
        height: compact ? 120 : 160, background: image ? `center/cover no-repeat url(${image})` : "linear-gradient(135deg,var(--saffron-200),var(--vermillion-200))",
        position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: 10,
      }}>
        <span style={{
          background: tone === "verified" ? "var(--navy-700)" : "var(--saffron-100)", color: tone === "verified" ? "#fff" : "var(--saffron-800)",
          fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "4px 9px", borderRadius: 999,
        }}>{tone === "verified" ? "Verified" : "Pending"}</span>
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--color-text-primary)" }}>{title}</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>{area}</span><span>{distance}</span>
        </div>
      </div>
    </div>
  );
}
