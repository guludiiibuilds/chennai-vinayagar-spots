"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
// Side-effect only: attaches L.markerClusterGroup to the Leaflet global that
// "leaflet" itself just set on window — must be imported after "leaflet" so
// that global exists by the time this module's top-level code reads it.
import "leaflet.markercluster";

const CHENNAI_CENTER = [13.0067, 80.257];

// Custom pin artwork (full-color Vinayaka idol inside a teardrop), supplied
// at 702x1011 — well over 2x the on-map display size, so it stays crisp on
// retina screens. Selection is signalled by scaling the whole marker up
// rather than swapping colors.
const PIN_ASSET = "/brand/locate.svg";
const PIN_ASPECT = 1011 / 702;

// Small corner badges on the pin itself, so "popular" and "nearby" idols
// stand out while panning/zooming without opening each one — popular
// (admin-flagged) gets a gold star at the top-right, nearby (within
// NEARBY_KM of the visitor) gets a plain green dot at the top-left. Either,
// both, or neither can show per spot.
function pinIcon(active, spot = {}) {
  const width = active ? 34 : 28;
  const height = Math.round(width * PIN_ASPECT);
  const badges = `${
    spot.is_popular
      ? `<div style="position:absolute;top:-2px;right:-2px;width:15px;height:15px;border-radius:50%;background:var(--saffron-400);border:1.5px solid #fff;display:grid;place-items:center;font-size:9px;line-height:1;color:#fff">★</div>`
      : ""
  }${
    spot.isNearby
      ? `<div style="position:absolute;top:-2px;left:-2px;width:10px;height:10px;border-radius:50%;background:var(--green);border:1.5px solid #fff"></div>`
      : ""
  }`;
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;animation:pinDrop .5s cubic-bezier(.2,.9,.3,1.2) both;filter:drop-shadow(0 2px 5px rgba(0,0,0,.3))">
        <img src="${PIN_ASSET}" width="${width}" height="${height}" style="display:block" />
        ${badges}
      </div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });
}

const meIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:0;border-radius:50%;background:var(--accent);animation:pulseRing 2.4s ease-out infinite"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:50%;background:var(--accent);border:2.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Cluster badge size steps up with count so a pandal-dense area (e.g. many
// idols reported around one street) reads as visibly "bigger" than a
// two-pin cluster, without needing a legend.
function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 25 ? 42 : 48;
  return L.divIcon({
    className: "",
    html: `
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--accent);color:#ffffff;display:grid;place-items:center;font:700 ${count < 100 ? 14 : 12}px var(--font-display);border:2.5px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,.3)">
        ${count}
      </div>`,
    iconSize: [size, size],
  });
}

// Imperative marker-cluster layer: react-leaflet has no first-class cluster
// component, so this drives Leaflet.markercluster directly via useMap(),
// the same pattern MinimalAttribution/FlyToSelection use elsewhere in this
// file. Clicking a cluster zooms into its bounds (the plugin's default);
// once individual pins are close enough apart to tell locations apart, the
// cluster splits and each pin behaves exactly as it did unclustered.
function ClusteredMarkers({ spots, selectedId, onSelect }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: clusterIcon,
    });
    clusterRef.current = cluster;
    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
      clusterRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    cluster.clearLayers();
    spots
      .filter((s) => s.lat != null && s.lng != null)
      .forEach((s) => {
        const marker = L.marker([s.lat, s.lng], { icon: pinIcon(s.id === selectedId, s) });
        if (onSelect) marker.on("click", () => onSelect(s));
        cluster.addLayer(marker);
      });
  }, [spots, selectedId, onSelect]);

  return null;
}

function MapControls({ userPos, onSearchClick }) {
  const map = useMap();
  return (
    <div style={{ position: "absolute", right: 14, top: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 500 }}>
      {onSearchClick ? (
        <button aria-label="Search" onClick={onSearchClick} style={ctrlBtnStyle}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      ) : null}
      <button
        aria-label="Center on my location"
        onClick={() => userPos && map.setView([userPos.lat, userPos.lng], 15)}
        style={ctrlBtnStyle}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3.2"></circle>
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"></path>
        </svg>
      </button>
      <button aria-label="Zoom in" onClick={() => map.zoomIn()} style={{ ...ctrlBtnStyle, font: "700 18px var(--font-display)", color: "var(--ink)" }}>
        +
      </button>
      <button aria-label="Zoom out" onClick={() => map.zoomOut()} style={{ ...ctrlBtnStyle, font: "700 18px var(--font-display)", color: "var(--ink)" }}>
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

// Leaflet sizes its tile grid once at load and has no way to notice its
// container changing size afterward — it just keeps rendering at the old
// size, leaving newly-revealed space blank (showing the plain background
// color set on MapContainer above). That happens whenever the mobile
// browser's own chrome changes how much of the screen it takes up: the
// address bar showing/hiding, or reopening the app finding it in a
// different state than at last paint. A ResizeObserver on the map's own
// container is the standard fix — it fires on the actual rendered size
// changing, regardless of what caused it, and re-syncs Leaflet to match.
function AutoInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    // Also covers the case where the resize happens while this tab is
    // backgrounded (no ResizeObserver callback fires until it's visible
    // again anyway, but this makes the intent explicit and catches any
    // gap between "visible" and the next real layout pass).
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

// react-leaflet's `center`/`zoom` on MapContainer are only the initial view —
// changing them after mount doesn't move an already-live map. This flies the
// map to the selected spot imperatively whenever the selection changes.
// `verticalFraction` re-centers on a point offset from the selected spot
// (rather than the spot itself) so the pin lands at that fraction of the
// container's height instead of dead-center — used to keep it clear of a
// bottom sheet that covers the lower part of the map. Leaving it unset
// centers normally, for layouts (e.g. desktop's sidebar detail) where
// nothing overlays the map.
function FlyToSelection({ target, zoom, verticalFraction }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.lat != null && target.lng != null) {
      let center = [target.lat, target.lng];
      if (verticalFraction != null) {
        const size = map.getSize();
        const offsetY = size.y * (0.5 - verticalFraction);
        center = map.unproject(map.project(center, zoom).add([0, offsetY]), zoom);
      }
      map.flyTo(center, zoom, { duration: 0.6 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);
  return null;
}

export default function MapCanvas({
  spots,
  selectedId,
  onSelect,
  userPos,
  focusSpot,
  focusZoom = 15,
  focusVerticalFraction,
  initialZoom = 12,
  onSearchClick,
}) {
  const mapRef = useRef(null);
  const initialCenter = spots[0]?.lat != null ? [spots[0].lat, spots[0].lng] : CHENNAI_CENTER;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      zoomControl={false}
      style={{ position: "absolute", inset: 0, zIndex: 0, background: "var(--paper)" }}
      ref={mapRef}
    >
      {/* CARTO's "Positron" basemap: a light, low-saturation style with
          minimal labels — reads as a calm surface for colorful pins to sit
          on, unlike stock OSM tiles' busy default colors/road styling. */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MinimalAttribution />
      <AutoInvalidateSize />
      <ClusteredMarkers spots={spots} selectedId={selectedId} onSelect={onSelect} />
      {userPos ? <Marker position={[userPos.lat, userPos.lng]} icon={meIcon} interactive={false} /> : null}
      {focusSpot ? null : <MapControls userPos={userPos} onSearchClick={onSearchClick} />}
      {focusSpot ? <FlyToSelection target={focusSpot} zoom={focusZoom} verticalFraction={focusVerticalFraction} /> : null}
    </MapContainer>
  );
}
