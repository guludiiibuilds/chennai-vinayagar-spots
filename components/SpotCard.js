"use client";

import Link from "next/link";
import { PhotoIcon } from "./icons";

export function SpotListCard({ spot, distanceLabel }) {
  return (
    <Link
      href={`/spot/${spot.id}`}
      style={{
        display: "flex",
        gap: 12,
        padding: 10,
        borderRadius: 16,
        background: "#FFF",
        border: "1px solid var(--line)",
        flex: "none",
      }}
    >
      <Thumb url={spot.photo_url} size={78} />
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
        <div style={{ font: "600 14.5px/1.25 var(--font-body)", color: "var(--ink)" }}>{spot.name}</div>
        <div style={{ font: "400 12px/1.35 var(--font-body)", color: "var(--muted)" }}>
          {spot.area}
          {distanceLabel ? ` · ${distanceLabel} km away` : ""}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
          <span className="tag">{spot.theme}</span>
        </div>
      </div>
    </Link>
  );
}

export function SpotCarouselCard({ spot, distanceLabel }) {
  return (
    <Link
      href={`/spot/${spot.id}`}
      style={{
        flex: "none",
        width: 236,
        scrollSnapAlign: "start",
        background: "var(--card)",
        borderRadius: 16,
        padding: 9,
        display: "flex",
        gap: 10,
        boxShadow: "0 6px 18px -6px rgba(42,27,16,.32)",
        border: "1px solid rgba(42,27,16,.07)",
      }}
    >
      <Thumb url={spot.photo_url} size={56} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            font: "600 13.5px/1.25 var(--font-body)",
            color: "var(--ink)",
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
    </Link>
  );
}

function Thumb({ url, size }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{
          flex: "none",
          width: size,
          height: size,
          borderRadius: size > 60 ? 12 : 11,
          objectFit: "cover",
          background: "#F0E2CB",
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
        borderRadius: size > 60 ? 12 : 11,
        background: "repeating-linear-gradient(135deg,#F0E2CB 0 7px,#E9D8BC 7px 14px)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <PhotoIcon width={size > 60 ? 20 : 18} height={size > 60 ? 20 : 18} />
    </div>
  );
}
