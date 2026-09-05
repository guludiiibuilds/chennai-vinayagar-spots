"use client";

import { Fragment } from "react";
import { renderRichText } from "@/lib/richtext";
import { googleMapsUrl } from "@/lib/geo";
import { CloseIcon, ShareIcon, NavigateIcon, PhotoIcon, PinPlaceIcon } from "./icons";

export default function SpotSheet({ spot, distanceLabel, onClose, onOpenPhoto }) {
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
    <Fragment>
      {/* Floats above the sheet's own box (rather than inside its
          overflow:hidden content) so it can never be covered by the
          sheet's rounded top edge or clipped content. icon-circular:
          44px, translucent + blurred, no shadow. */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
          right: 14,
          bottom: "calc(60% + 12px)",
          zIndex: 6,
          width: 44,
          height: 44,
          borderRadius: 9999,
          display: "grid",
          placeItems: "center",
          background: "rgba(255,255,255,.78)",
          backdropFilter: "saturate(180%) blur(14px)",
          WebkitBackdropFilter: "saturate(180%) blur(14px)",
        }}
      >
        <CloseIcon width={15} height={15} />
      </button>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "60%",
          zIndex: 5,
          background: "var(--card)",
          borderTop: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "fadeUp .22s ease both",
        }}
      >
        <div style={{ flex: "none", padding: "10px 14px 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto" }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "6px 18px 14px" }}>
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
                font: "400 11.5px/1.2 var(--font-body)",
                color: "var(--ink-soft)",
              }}
            >
              <PinPlaceIcon width={12} height={12} />
              {spot.area}
              {distanceLabel ? ` · ${distanceLabel} km` : ""}
            </div>
          </div>

          <h2 style={{ font: "600 24px/1.2 var(--font-display)", color: "var(--ink)", margin: "14px 0 0", letterSpacing: "-.374px" }}>
            {spot.name}
          </h2>

          {spot.about ? (
            <div style={{ font: "400 15px/1.5 var(--font-body)", color: "var(--ink-soft)", letterSpacing: "-.2px", marginTop: 14 }}>
              {renderRichText(spot.about)}
            </div>
          ) : null}
        </div>

        <div style={{ flex: "none", padding: "12px 14px 16px", borderTop: "1px solid var(--line)", display: "flex", gap: 9, background: "var(--card)" }}>
          <button
            onClick={share}
            aria-label="Share"
            style={{
              flex: "none",
              width: 50,
              height: 50,
              borderRadius: 9999,
              border: "1px solid var(--line-strong)",
              display: "grid",
              placeItems: "center",
              background: "var(--card)",
            }}
          >
            <ShareIcon />
          </button>
          <a
            href={googleMapsUrl(spot)}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              height: 50,
              borderRadius: 9999,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              font: "400 17px var(--font-body)",
              background: "var(--accent)",
            }}
          >
            <NavigateIcon />
            Take Me There
          </a>
        </div>
      </div>
    </Fragment>
  );
}
