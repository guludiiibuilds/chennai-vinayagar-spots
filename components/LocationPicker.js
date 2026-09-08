"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

const CHENNAI_CENTER = [13.0067, 80.257];

// Same artwork/proportions as the map pins elsewhere (see MapCanvas.js),
// but rendered here as a plain CSS-centered overlay rather than a Leaflet
// marker — this pin never moves; the map pans underneath it, so wherever
// it points is always exactly the map's current center.
const PIN_ASSET = "/pin-vinayaka.png";
const PIN_ASPECT = 75 / 43;
const PIN_WIDTH = 36;
const PIN_HEIGHT = Math.round(PIN_WIDTH * PIN_ASPECT);

// OpenStreetMap's tile usage policy requires visible attribution, so this
// only trims the "Leaflet" library credit (and its flag) that Leaflet
// prepends by default — the required "© OpenStreetMap contributors" stays.
function MinimalAttribution() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix(false);
  }, [map]);
  return null;
}

function MoveTracker({ onMoveEnd, onDragStart, onDragEnd }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      onMoveEnd({ lat: c.lat, lng: c.lng });
    },
    dragstart: () => onDragStart?.(),
    dragend: () => onDragEnd?.(),
  });
  return null;
}

const ctrlBtnStyle = {
  width: 44,
  height: 44,
  borderRadius: 9999,
  background: "rgba(255,255,255,.78)",
  backdropFilter: "saturate(180%) blur(14px)",
  WebkitBackdropFilter: "saturate(180%) blur(14px)",
  display: "grid",
  placeItems: "center",
};

export default function LocationPicker({ initialCenter, initialZoom = 16, onCenterChange }) {
  const mapRef = useRef(null);
  const draggingRef = useRef(false);
  const pinRef = useRef(null);
  const [locating, setLocating] = useState(false);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        mapRef.current?.flyTo([p.coords.latitude, p.coords.longitude], 17, { duration: 0.6 });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const setLifted = (lifted) => {
    const el = pinRef.current;
    if (!el) return;
    el.style.transform = `translate(-50%, calc(-100% - ${lifted ? 10 : 0}px))`;
    el.style.filter = `drop-shadow(0 ${lifted ? 10 : 4}px ${lifted ? 8 : 5}px rgba(0,0,0,.35))`;
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MapContainer
        center={initialCenter || CHENNAI_CENTER}
        zoom={initialZoom}
        zoomControl={false}
        style={{ position: "absolute", inset: 0, zIndex: 0, background: "var(--paper)" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MinimalAttribution />
        <MoveTracker
          onMoveEnd={onCenterChange}
          onDragStart={() => {
            draggingRef.current = true;
            setLifted(true);
          }}
          onDragEnd={() => {
            draggingRef.current = false;
            setLifted(false);
          }}
        />
      </MapContainer>

      {/* Fixed at the exact center of the map viewport; transform anchors
          the pin's visual tip (not its top-left) to that point. */}
      <div
        ref={pinRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -100%)",
          transition: "transform .15s ease, filter .15s ease",
          filter: "drop-shadow(0 4px 5px rgba(0,0,0,.35))",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <img src={PIN_ASSET} width={PIN_WIDTH} height={PIN_HEIGHT} alt="" style={{ display: "block" }} />
      </div>

      <div style={{ position: "absolute", right: 14, top: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 6 }}>
        <button aria-label="Center on my location" onClick={locateMe} disabled={locating} style={ctrlBtnStyle}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.2"></circle>
            <circle cx="12" cy="12" r="8"></circle>
            <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"></path>
          </svg>
        </button>
        <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} style={{ ...ctrlBtnStyle, font: "400 18px var(--font-body)", color: "var(--ink)" }}>
          +
        </button>
        <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} style={{ ...ctrlBtnStyle, font: "400 18px var(--font-body)", color: "var(--ink)" }}>
          −
        </button>
      </div>
    </div>
  );
}

export { CHENNAI_CENTER };
