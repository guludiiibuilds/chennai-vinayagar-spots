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
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
          <span className="tag">{spot.theme}</span>
        </div>
      </div>
    </button>
  );
}

export function SpotCarouselCard({ spot, distanceLabel, onOpen }) {
  return (
    <button
      onClick={() => onOpen(spot)}
      style={{
        flex: "none",
        width: 236,
        scrollSnapAlign: "start",
        background: "var(--card)",
        borderRadius: "var(--radius-lg)",
        padding: 9,
        display: "flex",
        gap: 10,
        border: "1px solid var(--line-strong)",
        textAlign: "left",
      }}
    >
      <Thumb url={spot.photo_url} size={56} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            font: "600 13.5px/1.25 var(--font-body)",
            color: "var(--ink)",
            letterSpacing: "-.2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {spot.name}
        </div>
        <div style={{ font: "400 11.5px/1.3 var(--font-body)", color: "var(--muted)", marginTop: 3 }}>
          {spot.area}
          {distanceLabel ? ` · ${distanceLabel} km` : ""}
        </div>
        <div className="tag" style={{ marginTop: 6 }}>
          {spot.theme}
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
