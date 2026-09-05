"use client";

import { CloseIcon } from "./icons";
import { useToast } from "./ToastProvider";

const steps = [
  "Spot a Vinayagar near you and submit a photo, name and location.",
  "A local volunteer checks it, usually within an hour. Until then, please explore other spots.",
  "Once approved, it appears on the map for everyone to visit.",
];

export default function MenuSheet({ open, onClose }) {
  const showToast = useToast();
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
        <div style={{ font: "400 12.5px/1.5 var(--font-body)", color: "var(--muted)", marginTop: 4 }}>
          A community-built map of Vinayagar Chaturthi pandals across Chennai. No login needed to browse or submit.
        </div>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((text, i) => (
            <div key={i} style={{ display: "flex", gap: 11 }}>
              <div
                style={{
                  flex: "none",
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-tint)",
                  display: "grid",
                  placeItems: "center",
                  font: "600 13px var(--font-body)",
                  color: "var(--accent)",
                }}
              >
                {i + 1}
              </div>
              <div style={{ font: "400 13px/1.55 var(--font-body)", color: "var(--ink-soft)" }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 2 }}>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Chennai Vinayagar Spots", url: window.location.origin }).catch(() => {});
              } else if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.origin).catch(() => {});
              }
              showToast("Link copied — share it on WhatsApp");
            }}
            style={{ textAlign: "left", padding: "12px 4px", font: "600 13.5px var(--font-body)", color: "var(--ink)" }}
          >
            Share this app
          </button>
          <button
            onClick={() => {
              onClose();
              showToast("Open the spot you'd like to report, then use Share to flag it");
            }}
            style={{ textAlign: "left", padding: "12px 4px", font: "600 13.5px var(--font-body)", color: "var(--ink)" }}
          >
            Report an issue
          </button>
        </div>
        <div style={{ marginTop: 18, font: "400 11px/1.6 var(--font-body)", color: "var(--muted)", textAlign: "center" }}>
          Built by <a href="https://www.linkedin.com/in/gurunivashr/">Guru Nivash</a>, for the Chennai community&nbsp;❤️
        </div>
      </div>
    </div>
  );
}
