"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { CARTO_TILE_URL, CARTO_ATTRIBUTION } from "@/lib/mapTiles";

const CHENNAI_CENTER = [13.0067, 80.257];

// A round push-pin (ball + needle), distinct from the teardrop artwork
// used for actual spot markers elsewhere (see MapCanvas.js) — this pin
// never moves; the map pans underneath it, so wherever it points is
// always exactly the map's current center. Drawn as inline SVG rather
// than a raster asset so the needle's tip — the true anchor point — lands
// on an exact pixel: the viewBox's bottom edge is that tip, so the same
// translate(-50%,-100%) anchoring used for the teardrop pin still lines
// up perfectly here.
const PIN_WIDTH = 30;
const PIN_HEIGHT = 42;

function PushPin() {
  return (
    <svg width={PIN_WIDTH} height={PIN_HEIGHT} viewBox="0 0 30 42" fill="none" style={{ display: "block" }}>
      <defs>
        <radialGradient id="pushPinBall" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff8a80" />
          <stop offset="45%" stopColor="var(--pin)" />
          <stop offset="100%" stopColor="var(--pin-active)" />
        </radialGradient>
      </defs>
      <line x1="15" y1="20" x2="15" y2="42" stroke="#5b5b5b" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="15" cy="12" r="11.5" fill="url(#pushPinBall)" stroke="rgba(0,0,0,.15)" strokeWidth="0.75" />
      <circle cx="11" cy="7.5" r="3" fill="rgba(255,255,255,.5)" />
    </svg>
  );
}

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

// See the identical helper in MapCanvas.js: Leaflet doesn't notice its
// container resizing on its own (address bar show/hide, reopening the
// browser in a different chrome state), so it keeps rendering tiles at
// the stale size unless something explicitly tells it to re-measure.
function AutoInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    const onVisible = () => {
      if (document.visibilityState === "visible") map.invalidateSize();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
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
      // See the matching comment in app/page.js's beginLocating — a
      // network-based fix avoids the risk of a slow/timed-out cold GPS
      // lock, and the pin gets dragged into place manually anyway.
      // maximumAge accepts a position the OS already has cached instead of
      // forcing a brand new fix every tap.
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
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
        <TileLayer url={CARTO_TILE_URL} attribution={CARTO_ATTRIBUTION} />
        <MinimalAttribution />
        <AutoInvalidateSize />
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
        <PushPin />
      </div>

      <div style={{ position: "absolute", right: 14, top: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 6 }}>
        <button aria-label="Center on my location" onClick={locateMe} disabled={locating} style={ctrlBtnStyle}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.2"></circle>
            <circle cx="12" cy="12" r="8"></circle>
            <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"></path>
          </svg>
        </button>
        <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} style={{ ...ctrlBtnStyle, font: "700 18px var(--font-display)", color: "var(--ink)" }}>
          +
        </button>
        <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} style={{ ...ctrlBtnStyle, font: "700 18px var(--font-display)", color: "var(--ink)" }}>
          −
        </button>
      </div>
    </div>
  );
}

export { CHENNAI_CENTER };
