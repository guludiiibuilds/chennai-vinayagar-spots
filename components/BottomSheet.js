import React from "react";

export function BottomSheet({ children, dragHandle = true, style }) {
  return (
    <div style={{
      background: "var(--color-surface-elevated)", borderRadius: "var(--radius-bottom-sheet)",
      boxShadow: "var(--shadow-elevated)", padding: "var(--layout-bottom-sheet-padding)", ...style,
    }}>
      {dragHandle && <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border-strong)", margin: "0 auto 14px" }} />}
      {children}
    </div>
  );
}
