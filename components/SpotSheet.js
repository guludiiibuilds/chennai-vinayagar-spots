"use client";

import { Fragment } from "react";
import { renderRichText } from "@/lib/richtext";
import { googleMapsUrl } from "@/lib/geo";
import { useToast } from "./ToastProvider";
import { CloseIcon, ShareIcon, NavigateIcon, PhotoIcon, PinPlaceIcon } from "./icons";

export default function SpotSheet({ spot, distanceLabel, onClose }) {
  const showToast = useToast();
  if (!spot) return null;

  const share = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/?spot=${spot.id}` : "";
    if (navigator.share) {
      navigator.share({ title: spot.name, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast("Link copied — share it on WhatsApp");
  };

  return (
    <Fragment>
      {/* Floats above the sheet's own box (rather than inside its
          overflow:hidden content) so it can never be covered by the
          sheet's rounded top edge or clipped content. */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
          right: 14,
          bottom: "calc(60% + 12px)",
          zIndex: 6,
          width: 38,
          height: 38,
          borderRadius: 13,
          display: "grid",
          placeItems: "center",
          background: "var(--card)",
          boxShadow: "0 4px 14px rgba(42,27,16,.3)",
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
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -14px 34px -12px rgba(42,27,16,.4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "fadeUp .22s ease both",
        }}
      >
        <div style={{ flex: "none", padding: "10px 14px 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(42,27,16,.18)", margin: "0 auto" }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "6px 18px 14px" }}>
          <div
            style={{
              position: "relative",
              height: 168,
              borderRadius: 14,
              background: spot.photo_url
                ? `center / cover no-repeat url(${spot.photo_url})`
                : "repeating-linear-gradient(135deg,#EFDFC4 0 9px,#E7D4B2 9px 18px)",
              display: spot.photo_url ? "block" : "grid",
              placeItems: "center",
            }}
          >
            {!spot.photo_url ? <PhotoIcon stroke="#B08F58" width={26} height={26} /> : null}
            <div
              style={{
                position: "absolute",
                right: 10,
                bottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(255,252,246,.94)",
                borderRadius: 999,
                padding: "6px 10px",
                boxShadow: "0 3px 10px rgba(42,27,16,.18)",
                font: "500 11.5px/1.2 var(--font-body)",
                color: "var(--ink-soft)",
              }}
            >
              <PinPlaceIcon width={12} height={12} />
              {spot.area}
              {distanceLabel ? ` · ${distanceLabel} km` : ""}
            </div>
          </div>

          <h2 style={{ font: "400 24px/1.15 var(--font-display)", color: "var(--ink)", margin: "14px 0 0", letterSpacing: "-.01em" }}>
            {spot.name}
          </h2>

          {spot.about ? (
            <div style={{ font: "400 14px/1.6 var(--font-body)", color: "var(--ink-soft)", marginTop: 14 }}>
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
              width: 54,
              height: 54,
              borderRadius: 16,
              border: "1.5px solid rgba(42,27,16,.16)",
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
              height: 54,
              borderRadius: 16,
              color: "#FFF6E6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              font: "600 15px var(--font-body)",
              background: "var(--ochre)",
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
