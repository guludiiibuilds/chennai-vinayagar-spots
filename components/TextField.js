import React from "react";

export function TextField({ label, placeholder, value, onChange, helper, error, multiline }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--font-body)" }}>
      {label && <span style={{ fontSize: "var(--text-label-size)", fontWeight: "var(--text-label-weight)", color: "var(--color-text-secondary)" }}>{label}</span>}
      <Tag
        value={value} onChange={onChange} placeholder={placeholder} rows={multiline ? 3 : undefined}
        style={{
          padding: "13px 16px", borderRadius: "var(--radius-input)", border: `1.5px solid ${error ? "var(--color-error)" : "var(--color-border-default)"}`,
          background: "var(--color-surface-elevated)", fontSize: "var(--text-body-size)", color: "var(--color-text-primary)",
          outline: "none", fontFamily: "inherit", resize: multiline ? "vertical" : "none",
        }}
        onFocus={e => e.target.style.boxShadow = "var(--shadow-focus)"}
        onBlur={e => e.target.style.boxShadow = "none"}
      />
      {(helper || error) && <span style={{ fontSize: "var(--text-caption-size)", color: error ? "var(--color-error)" : "var(--color-text-muted)" }}>{error || helper}</span>}
    </label>
  );
}
