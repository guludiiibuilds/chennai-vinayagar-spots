"use client";

import React from "react";

export function PhotoUpload({ preview, onSelect, label = "Add a photo" }) {
  const ref = React.useRef();
  return (
    <div onClick={() => ref.current && ref.current.click()} style={{
      borderRadius: "var(--radius-image)", border: "2px dashed var(--color-border-strong)",
      background: preview ? `center/cover no-repeat url(${preview})` : "var(--cream-200)",
      height: 180, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", fontWeight: 600, gap: 8, flexDirection: "column",
    }}>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={onSelect} />
      {!preview && (<>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-primary)" strokeWidth="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z" strokeLinejoin="round"/><circle cx="12" cy="13" r="3.5"/></svg>
        <span>{label}</span>
      </>)}
    </div>
  );
}
