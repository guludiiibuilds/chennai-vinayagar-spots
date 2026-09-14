"use client";

import { CloseIcon } from "./icons";

export default function PhotoViewer({ spot, onClose }) {
  if (!spot?.photo_url) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 45,
        background: "#000000",
        animation: "fadeUp .2s ease both",
      }}
    >
      {/* Absolutely positioned against the same box as its parent, rather
          than a percentage-sized grid/flex item — a percentage height on a
          grid item inside an auto-sized row doesn't reliably resolve
          against the container (it falls back to the image's own intrinsic
          aspect ratio instead), which let a tall photo render at its full
          native size and overflow top-anchored past the bottom instead of
          being centered and scaled down. object-fit still does the
          scale-to-fit + centering work, just against an unambiguous box. */}
      <img
        src={spot.photo_url}
        alt={spot.name}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
      <button
        onClick={onClose}
        aria-label="Close photo"
        style={{
          position: "absolute",
          right: 14,
          top: 14,
          width: 44,
          height: 44,
          borderRadius: 9999,
          display: "grid",
          placeItems: "center",
          background: "rgba(255,255,255,.2)",
          backdropFilter: "saturate(180%) blur(14px)",
          WebkitBackdropFilter: "saturate(180%) blur(14px)",
        }}
      >
        <CloseIcon stroke="#ffffff" width={15} height={15} />
      </button>
    </div>
  );
}
