"use client";

import { renderRichText } from "@/lib/richtext";
import { googleMapsUrl } from "@/lib/geo";
import { BackIcon, ShareIcon, NavigateIcon, PhotoIcon, PinPlaceIcon } from "./icons";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

// Sidebar counterpart to SpotSheet — same spot detail, laid out in normal
// document flow (not an absolutely-positioned bottom sheet) since on
// tablet/desktop it lives inside the fixed-width sidebar column next to an
// always-visible map, rather than floating over it.
export default function SpotPanel({ spot, distanceLabel, onBack, onOpenPhoto }) {
  if (!spot) return null;

  const share = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/?spot=${spot.id}` : "";
    if (navigator.share) {
      navigator.share({ title: spot.name, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "fadeUp .22s ease both" }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px 4px", font: "700 13px var(--font-body)", letterSpacing: "0.02em", color: "var(--ink-soft)", flex: "none" }}
      >
        <BackIcon width={15} height={15} />
        Back to list
      </button>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px 18px" }}>
        <div
          className={spot.photo_url ? "photo-shadow" : undefined}
          onClick={spot.photo_url ? onOpenPhoto : undefined}
          style={{
            position: "relative",
            height: 168,
            borderRadius: "var(--radius-lg)",
            background: spot.photo_url ? `center / cover no-repeat url(${spot.photo_url})` : "var(--paper)",
            display: spot.photo_url ? "block" : "grid",
            placeItems: "center",
            cursor: spot.photo_url ? "pointer" : "default",
          }}
        >
          {!spot.photo_url ? <PhotoIcon width={26} height={26} /> : null}
          <div
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(255,255,255,.78)",
              backdropFilter: "saturate(180%) blur(14px)",
              WebkitBackdropFilter: "saturate(180%) blur(14px)",
              borderRadius: 9999,
              padding: "6px 10px",
              font: "700 11px var(--font-display)",
              color: "var(--ink-soft)",
            }}
          >
            <PinPlaceIcon width={12} height={12} />
            {spot.area}
            {distanceLabel ? ` · ${distanceLabel} km` : ""}
          </div>
        </div>

        <h2 style={{ font: "600 22px/1.2 var(--font-display)", color: "var(--ink)", margin: "14px 0 0", letterSpacing: "-.374px" }}>
          {spot.name}
        </h2>

        {spot.about ? (
          <div style={{ font: "400 14.5px/1.5 var(--font-body)", color: "var(--ink-soft)", letterSpacing: "-.2px", marginTop: 12 }}>
            {renderRichText(spot.about)}
          </div>
        ) : null}
      </div>

      <div style={{ flex: "none", padding: "12px 16px 16px", borderTop: "1px solid var(--line)", display: "flex", gap: 9 }}>
        <IconButton variant="outline" label="Share" onClick={share} icon={<ShareIcon />} style={{ width: 46, height: 46, borderRadius: 9999 }} />
        <Button
          variant="primary"
          onClick={() => window.open(googleMapsUrl(spot), "_blank", "noopener,noreferrer")}
          icon={<NavigateIcon />}
          style={{ flex: 1, height: 46 }}
        >
          Take Me There
        </Button>
      </div>
    </div>
  );
}
