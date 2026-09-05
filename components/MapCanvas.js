"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

const CHENNAI_CENTER = [13.0067, 80.257];

function pinIcon(active) {
  const size = active ? 36 : 30;
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;animation:pinDrop .5s cubic-bezier(.2,.9,.3,1.2) both">
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:${active ? "#8E1B15" : "#A8231C"};border:2.5px solid #FFF6E6;display:grid;place-items:center;box-shadow:0 5px 12px rgba(42,27,16,.35)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFF6E6" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v3"></path><path d="M7.5 20h9"></path><path d="M6 20c0-4 2.7-7 6-7s6 3 6 7"></path><circle cx="12" cy="8.5" r="2.2"></circle></svg>
        </div>
        <div style="width:2px;height:8px;background:#8E3A12;border-radius:0 0 2px 2px"></div>
      </div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
  });
}

const meIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:0;border-radius:50%;background:#2E6CD6;animation:pulseRing 2.4s ease-out infinite"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:50%;background:#2E6CD6;border:2.5px solid #FFFCF6;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>
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
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E6CD6" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3.2"></circle>
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"></path>
        </svg>
      </button>
      <button aria-label="Zoom in" onClick={() => map.zoomIn()} style={{ ...ctrlBtnStyle, font: "700 17px var(--font-body)", color: "#5B4530" }}>
        +
      </button>
      <button aria-label="Zoom out" onClick={() => map.zoomOut()} style={{ ...ctrlBtnStyle, font: "700 17px var(--font-body)", color: "#5B4530" }}>
        −
      </button>
    </div>
  );
}

const ctrlBtnStyle = {
  width: 38,
  height: 38,
  borderRadius: 13,
  background: "var(--card)",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 3px 10px rgba(42,27,16,.18)",
  cursor: "pointer",
};

export default function MapCanvas({ spots, selectedId, onSelect, userPos, center, zoom = 12, minimal = false }) {
  const mapRef = useRef(null);
  const focus = center || (spots[0]?.lat != null ? [spots[0].lat, spots[0].lng] : CHENNAI_CENTER);

  return (
    <MapContainer
      center={focus}
      zoom={zoom}
      zoomControl={false}
      dragging={!minimal}
      scrollWheelZoom={!minimal}
      doubleClickZoom={!minimal}
      touchZoom={!minimal}
      attributionControl={!minimal}
      style={{ position: "absolute", inset: 0, background: "#F4EADA" }}
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
      {minimal ? null : <MapControls userPos={userPos} />}
    </MapContainer>
  );
}
