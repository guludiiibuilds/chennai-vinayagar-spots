"use client";

import { useToast } from "./ToastProvider";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { CloseIcon } from "./icons";

// A popup, not a navigation: clicking "Spot a Vinayagar" on desktop stays
// on the map — this explains why submitting needs a phone (camera + GPS)
// and offers copying the link, but "Keep Exploring" just dismisses it
// rather than sending anyone into a form that can't actually be used here.
export default function MobileOnlyPrompt({ onClose }) {
  const showToast = useToast();

  const copyLink = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast("Link copied — paste it on your phone");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,.4)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 340,
          background: "var(--card)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 24px 24px",
          textAlign: "center",
          position: "relative",
          animation: "fadeUp .22s ease both",
        }}
      >
        <IconButton
          variant="soft"
          label="Close"
          onClick={onClose}
          icon={<CloseIcon />}
          style={{ position: "absolute", top: 12, right: 12, borderRadius: 10 }}
        />
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--accent-tint)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="2"></rect>
            <line x1="11" y1="18" x2="13" y2="18"></line>
          </svg>
        </div>
        <h2 style={{ font: "600 19px/1.3 var(--font-display)", letterSpacing: "-.2px", color: "var(--ink)", marginTop: 16 }}>
          Spotting a Vinayagar is mobile-only
        </h2>
        <p style={{ font: "400 13.5px/1.55 var(--font-body)", color: "var(--ink-soft)", marginTop: 8 }}>
          Submitting needs your phone&apos;s camera and location. Copy the link below to continue there.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <Button variant="primary" onClick={copyLink} style={{ height: 48 }}>
            Copy Link
          </Button>
          <Button variant="ghost" onClick={onClose} style={{ height: 40, color: "var(--color-text-muted)" }}>
            Keep Exploring on Desktop
          </Button>
        </div>
      </div>
    </div>
  );
}
