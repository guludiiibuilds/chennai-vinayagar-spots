"use client";

import { CloseIcon } from "./icons";

const steps = [
  "Spot a Vinayagar near you and submit a photo, name and location.",
  "A local volunteer checks it, usually within an hour. Until then, please explore other spots.",
  "Once approved, it appears on the map for everyone to visit.",
];

export default function MenuSheet({ open, onClose }) {
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
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          padding: "22px 20px 28px",
          animation: "fadeUp .22s ease both",
          maxHeight: "78%",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, position: "relative" }}>
          <div style={{ font: "600 24px/1.2 var(--font-display)", letterSpacing: "-.374px", color: "var(--ink)" }}>Vinayagar Spots</div>
          <button aria-label="Close menu" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center" }}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ font: "400 14px/1.55 var(--font-body)", color: "var(--ink-soft)", marginTop: 6 }}>
          A community-built map of Vinayagar Chaturthi pandals across Chennai. No login needed to browse or submit.
        </div>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map((text, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  flex: "none",
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-tint)",
                  display: "grid",
                  placeItems: "center",
                  font: "600 14px var(--font-body)",
                  color: "var(--accent)",
                }}
              >
                {i + 1}
              </div>
              <div style={{ font: "400 15px/1.6 var(--font-body)", color: "var(--ink-soft)" }}>{text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              height: 50,
              borderRadius: 9999,
              background: "var(--accent)",
              color: "#ffffff",
              font: "400 17px var(--font-body)",
            }}
          >
            Start Vinayaka Hopping
          </button>
          <a
            href="mailto:?subject=Feedback%20for%20Chennai%20Vinayagar%20Spots"
            style={{
              height: 46,
              borderRadius: 9999,
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "400 15px var(--font-body)",
            }}
          >
            Share Feedback
          </a>
        </div>

        <div style={{ marginTop: 18, font: "400 12px/1.6 var(--font-body)", color: "var(--muted)", textAlign: "center" }}>
          Built by <a href="https://www.linkedin.com/in/gurunivashr/">Guru Nivash</a>, for the Chennai community&nbsp;❤️
        </div>
      </div>
    </div>
  );
}
