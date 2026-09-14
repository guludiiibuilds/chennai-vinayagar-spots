"use client";

import { CloseIcon, CheckIcon, PinPlaceIcon } from "./icons";
import { IconButton } from "./IconButton";
import { Spinner } from "./Button";

// One tappable row per filter — icon, label, and a trailing checkmark
// when it's the active filter (or a spinner in "near"'s place while its
// location fetch is in flight, driven by the same requireLocation/
// locatingFor machinery the old inline chip used).
function FilterRow({ icon, label, selected, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 14px",
        borderRadius: "var(--radius-lg)",
        border: `1.5px solid ${selected ? "var(--color-brand-primary)" : "var(--color-border-default)"}`,
        background: selected ? "var(--vermillion-50)" : "var(--color-surface-elevated)",
        opacity: loading ? 0.7 : 1,
      }}
    >
      <div
        style={{
          flex: "none",
          width: 34,
          height: 34,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: selected ? "var(--color-brand-primary)" : "var(--cream-200)",
          color: selected ? "#fff" : "var(--ink-soft)",
        }}
      >
        {loading ? <Spinner /> : icon}
      </div>
      <div style={{ flex: 1, textAlign: "left", font: "600 14.5px var(--font-body)", color: "var(--ink)" }}>
        {loading ? "Fetching your location…" : label}
      </div>
      {selected && !loading ? <CheckIcon width={18} height={18} strokeWidth={3} /> : null}
    </button>
  );
}

export default function FilterSheet({ open, onClose, filterMode, locatingFor, onSelectNear, onSelectPopular }) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--card)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          boxShadow: "var(--shadow-lg)",
          padding: "22px 20px calc(20px + env(safe-area-inset-bottom, 0px))",
          animation: "fadeUp .22s ease both",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ font: "600 19px/1.2 var(--font-display)", letterSpacing: "-.374px", color: "var(--ink)" }}>Filter spots</div>
          <IconButton variant="soft" label="Close" onClick={onClose} icon={<CloseIcon />} style={{ width: 32, height: 32, borderRadius: 10 }} />
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <FilterRow
            icon={<PinPlaceIcon stroke="currentColor" />}
            label="Near me"
            selected={filterMode === "near"}
            loading={locatingFor === "near"}
            onClick={onSelectNear}
          />
          <FilterRow icon={<span style={{ fontSize: 15 }}>★</span>} label="Popular" selected={filterMode === "popular"} onClick={onSelectPopular} />
        </div>
      </div>
    </div>
  );
}
