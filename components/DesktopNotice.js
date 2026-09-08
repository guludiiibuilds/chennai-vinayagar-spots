"use client";

import { useToast } from "./ToastProvider";

export default function DesktopNotice({ onContinue }) {
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
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,.4)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          background: "var(--card)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 24px 24px",
          textAlign: "center",
          animation: "fadeUp .22s ease both",
        }}
      >
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
          This works best on mobile
        </h2>
        <p style={{ font: "400 13.5px/1.55 var(--font-body)", color: "var(--ink-soft)", marginTop: 8 }}>
          Spotting a Vinayaka uses your phone&apos;s camera and location. Copy the link to continue on mobile, or
          go ahead here anyway.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <button
            onClick={copyLink}
            style={{
              height: 48,
              borderRadius: 9999,
              background: "var(--accent)",
              color: "#ffffff",
              font: "400 16px var(--font-body)",
            }}
          >
            Copy Link
          </button>
          <button
            onClick={onContinue}
            style={{
              height: 40,
              borderRadius: 9999,
              background: "transparent",
              color: "var(--muted)",
              font: "400 14px var(--font-body)",
            }}
          >
            Continue on Desktop Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
