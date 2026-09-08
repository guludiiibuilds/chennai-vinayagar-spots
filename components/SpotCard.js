"use client";

import { PhotoIcon } from "./icons";

export function SpotListCard({ spot, distanceLabel, onOpen }) {
  return (
    <button
      onClick={() => onOpen(spot)}
      style={{
        display: "flex",
        gap: 12,
        padding: 10,
        borderRadius: "var(--radius-lg)",
        background: "var(--card)",
        border: "1px solid var(--line-strong)",
        boxShadow: "var(--shadow-card)",
        flex: "none",
        textAlign: "left",
        width: "100%",
      }}
    >
      <Thumb url={spot.photo_url} size={78} />
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
        <div style={{ font: "600 14.5px/1.25 var(--font-body)", color: "var(--ink)", letterSpacing: "-.2px" }}>{spot.name}</div>
        <div style={{ font: "400 12px/1.35 var(--font-body)", color: "var(--muted)" }}>
          {spot.area}
          {distanceLabel ? ` · ${distanceLabel} km away` : ""}
        </div>
      </div>
    </button>
  );
}

function Thumb({ url, size }) {
  const radius = size > 60 ? "var(--radius-sm)" : "var(--radius-xs)";
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{
          flex: "none",
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          background: "var(--paper)",
        }}
      />
    );
  }
  return (
    <div
      style={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: radius,
        background: "var(--paper)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <PhotoIcon width={size > 60 ? 20 : 18} height={size > 60 ? 20 : 18} />
    </div>
  );
}
