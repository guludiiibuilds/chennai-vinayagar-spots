import React from "react";

export function EmptyState({ icon = "\u{1F6D5}", title, description, action }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: "var(--font-body)" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--saffron-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--color-text-primary)" }}>{title}</div>
      {description && <div style={{ fontSize: 14, color: "var(--color-text-muted)", maxWidth: 280 }}>{description}</div>}
      {action}
    </div>
  );
}
