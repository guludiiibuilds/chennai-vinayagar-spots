import React from "react";

export function MapMarker({ variant = "default", selected, count, label }) {
  if (variant === "cluster") {
    return (
      <div style={{
        width: 40, height: 40, borderRadius: "50%", background: "var(--navy-700)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)",
        fontWeight: 700, fontSize: 14, border: "3px solid #fff", boxShadow: "var(--shadow-card)",
      }}>{count}</div>
    );
  }
  if (variant === "user") {
    return <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--blue-500)", border: "3px solid #fff", boxShadow: "0 0 0 4px rgba(46,125,166,0.25)" }} />;
  }
  const bg = variant === "verified" ? "var(--navy-700)" : "var(--color-brand-primary)";
  const scale = selected ? 1.2 : 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${scale})`, transformOrigin: "bottom center" }}>
      <div style={{
        width: 36, height: 36, borderRadius: "var(--radius-marker)", background: bg, display: "flex", alignItems: "center",
        justifyContent: "center", boxShadow: selected ? "var(--shadow-floating)" : "var(--shadow-card)", border: "2.5px solid #fff",
        transform: "rotate(45deg)",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: "rotate(-45deg)" }} fill="#fff"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" /></svg>
      </div>
      {selected && label && <span style={{ marginTop: 4, background: "var(--navy-800)", color: "#fff", fontSize: "var(--text-map-label-size)", fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{label}</span>}
    </div>
  );
}
