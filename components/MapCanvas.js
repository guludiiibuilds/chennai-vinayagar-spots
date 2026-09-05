"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

const CHENNAI_CENTER = [13.0067, 80.257];
const PIN = "#ff3b30";
const PIN_ACTIVE = "#d70015";
const ACCENT = "#0066cc";

function pinIcon(active) {
  const size = active ? 36 : 30;
  const color = active ? PIN_ACTIVE : PIN;
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;animation:pinDrop .5s cubic-bezier(.2,.9,.3,1.2) both">
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid #ffffff;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.25)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v3"></path><path d="M7.5 20h9"></path><path d="M6 20c0-4 2.7-7 6-7s6 3 6 7"></path><circle cx="12" cy="8.5" r="2.2"></circle></svg>
        </div>
        <div style="width:2px;height:8px;background:${color};border-radius:0 0 2px 2px"></div>
      </div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
  });
}

const meIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${ACCENT};animation:pulseRing 2.4s ease-out infinite"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:50%;background:${ACCENT};border:2.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapControls({ userPos }) {
  const map = useMap();
  return (
    <div style={{ position: "absolute", right: 14, top: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 500 }}>
      <button
        aria-label="Center on my location"
        onClick={() => userPos && map.setView([userPos.lat, userPos.lng], 15)}
        style={ctrlBtnStyle}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3.2"></circle>
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"></path>
        </svg>
      </button>
      <button aria-label="Zoom in" onClick={() => map.zoomIn()} style={{ ...ctrlBtnStyle, font: "400 18px var(--font-body)", color: "var(--ink)" }}>
        +
      </button>
      <button aria-label="Zoom out" onClick={() => map.zoomOut()} style={{ ...ctrlBtnStyle, font: "400 18px var(--font-body)", color: "var(--ink)" }}>
        −
      </button>
    </div>
  );
}

// icon-circular: 44px, translucent chip over photography, no shadow —
// elevation here comes from translucency + blur, not a drop-shadow.
const ctrlBtnStyle = {
  width: 44,
  height: 44,
  borderRadius: 9999,
  background: "rgba(255,255,255,.78)",
  backdropFilter: "saturate(180%) blur(14px)",
  WebkitBackdropFilter: "saturate(180%) blur(14px)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

// react-leaflet's `center`/`zoom` on MapContainer are only the initial view —
// changing them after mount doesn't move an already-live map. This flies the
// map to the selected spot imperatively whenever the selection changes.
function FlyToSelection({ target, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.lat != null && target.lng != null) {
      map.flyTo([target.lat, target.lng], zoom, { duration: 0.6 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);
  return null;
}

export default function MapCanvas({ spots, selectedId, onSelect, userPos, focusSpot, focusZoom = 15 }) {
  const mapRef = useRef(null);
  const initialCenter = spots[0]?.lat != null ? [spots[0].lat, spots[0].lng] : CHENNAI_CENTER;

  return (
    <MapContainer
      center={initialCenter}
      zoom={12}
      zoomControl={false}
      style={{ position: "absolute", inset: 0, zIndex: 0, background: "var(--paper)" }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {spots
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={pinIcon(s.id === selectedId)}
            eventHandlers={onSelect ? { click: () => onSelect(s) } : undefined}
          />
        ))}
      {userPos ? <Marker position={[userPos.lat, userPos.lng]} icon={meIcon} interactive={false} /> : null}
      {focusSpot ? null : <MapControls userPos={userPos} />}
      {focusSpot ? <FlyToSelection target={focusSpot} zoom={focusZoom} /> : null}
    </MapContainer>
  );
}
