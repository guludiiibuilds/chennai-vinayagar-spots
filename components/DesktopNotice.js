"use client";

import { useToast } from "./ToastProvider";
import { Button } from "./Button";

// A hard stop, not a nudge: submitting a spot needs a phone's camera and
// GPS, so desktop only ever browses — there's no "continue anyway" here.
export default function DesktopNotice({ onBack }) {
  const showToast = useToast();

  const copyLink = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast("Link copied — paste it on your phone");
  };

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--accent-tint)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="2"></rect>
            <line x1="11" y1="18" x2="13" y2="18"></line>
          </svg>
        </div>
        <h2 style={{ font: "600 20px/1.3 var(--font-display)", letterSpacing: "-.2px", color: "var(--ink)", marginTop: 18 }}>
          Spotting a Vinayagar is mobile-only
        </h2>
        <p style={{ font: "400 14px/1.55 var(--font-body)", color: "var(--ink-soft)", marginTop: 8, maxWidth: 300 }}>
          Submitting needs your phone&apos;s camera and location, so it only works there. Copy the link below to
          continue on mobile.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22, width: "100%", maxWidth: 280 }}>
          <Button variant="primary" onClick={copyLink} style={{ height: 48 }}>
            Copy Link
          </Button>
          <Button variant="ghost" onClick={onBack} style={{ height: 40, color: "var(--color-text-muted)" }}>
            Back to Map
          </Button>
        </div>
      </div>
    </div>
  );
}
