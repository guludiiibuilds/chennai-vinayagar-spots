"use client";

import { Button } from "./Button";

// A soft warning, never a hard block: two pandals can legitimately sit
// close together on the same street, so this only asks the submitter to
// confirm rather than rejecting the submission. Shared between the map
// location picker (checked as soon as a location is confirmed) and the
// submit form's pasted-Google-Maps-link field (checked on blur, with the
// same check repeated once more at final submit as a safety net for
// whichever of those two never actually ran).
export default function DuplicateSpotSheet({ spot, onCancel, onContinue }) {
  if (!spot) return null;

  return (
    <div
      onClick={onCancel}
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
          padding: "20px 20px 18px",
          animation: "fadeUp .22s ease both",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: "none", width: 42, height: 42, borderRadius: "50%", background: "var(--saffron-50)", display: "grid", placeItems: "center" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--saffron-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path>
              <path d="M12 9v4M12 17h.01"></path>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 16px/1.3 var(--font-display)", letterSpacing: "-.2px", color: "var(--ink)" }}>Already a spot nearby</div>
            <div style={{ font: "400 13.5px/1.5 var(--font-body)", color: "var(--ink-soft)", marginTop: 5 }}>
              <strong style={{ color: "var(--ink)" }}>{spot.name}</strong> is about {Math.max(1, Math.round(spot.distKm * 1000))}m away. If this is a
              different idol, continue anyway.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
          <Button variant="outline" onClick={onCancel} style={{ flex: 1, height: 48 }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onContinue} style={{ flex: 1, height: 48 }}>
            It&apos;s different, continue
          </Button>
        </div>
      </div>
    </div>
  );
}
