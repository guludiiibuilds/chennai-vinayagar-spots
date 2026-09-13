"use client";

import { Spinner } from "./Button";

// Shown while the Leaflet chunk itself is still downloading/parsing (it's
// dynamically imported everywhere it's used, so this covers that gap) — a
// plain colored div here just looks frozen on a slow first load; a visible
// spinner at least signals "still working" during that window.
export default function MapLoadingPlaceholder() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--paper)", display: "grid", placeItems: "center" }}>
      <div style={{ color: "var(--accent)", transform: "scale(1.8)" }}>
        <Spinner />
      </div>
    </div>
  );
}
