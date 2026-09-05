"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { fetchSpotById } from "@/lib/spots";
import { distanceKm, formatDistance, googleMapsUrl } from "@/lib/geo";
import { renderRichText } from "@/lib/richtext";
import { useToast } from "@/components/ToastProvider";
import { BackIcon, ShareIcon, NavigateIcon, PhotoIcon, PinPlaceIcon } from "@/components/icons";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), { ssr: false });

export default function SpotDetailClient({ id }) {
  const router = useRouter();
  const showToast = useToast();
  const [spot, setSpot] = useState(null);
  const [status, setStatus] = useState("loading");
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSpotById(id)
      .then((data) => {
        if (cancelled) return;
        setSpot(data);
        setStatus(data ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const dist = useMemo(() => {
    if (!spot || !userPos) return null;
    return formatDistance(distanceKm(userPos, { lat: spot.lat, lng: spot.lng }));
  }, [spot, userPos]);

  const share = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ title: spot?.name, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast("Link copied — share it on WhatsApp");
  };

  if (status === "loading") {
    return (
      <div className="app-shell">
        <div className="app-frame" style={{ display: "grid", placeItems: "center" }}>
          <div style={{ font: "400 13px var(--font-body)", color: "var(--muted)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (status === "missing" || status === "error") {
    return (
      <div className="app-shell">
        <div className="app-frame" style={{ display: "grid", placeItems: "center", gap: 14, padding: 24, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)" }}>
            {status === "missing" ? "Spot not found" : "Couldn't load this spot"}
          </div>
          <button
            onClick={() => router.push("/")}
            style={{ height: 46, padding: "0 20px", borderRadius: 14, background: "var(--ochre)", color: "#FFF6E6", font: "600 14px var(--font-body)" }}
          >
            Back to map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ animation: "fadeUp .28s ease both" }}>
        <div
          style={{
            position: "relative",
            flex: "none",
            height: 266,
            background: spot.photo_url
              ? `center / cover no-repeat url(${spot.photo_url})`
              : "repeating-linear-gradient(135deg,#EFDFC4 0 9px,#E7D4B2 9px 18px)",
            display: "grid",
            placeItems: "center",
          }}
        >
          {!spot.photo_url ? (
            <div style={{ textAlign: "center" }}>
              <PhotoIcon stroke="#B08F58" width={30} height={30} />
              <div style={{ font: "400 11px/1 var(--font-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "#B08F58", marginTop: 8 }}>
                Community photo
              </div>
            </div>
          ) : null}
          <button onClick={() => router.push("/")} aria-label="Back" style={roundBtnStyle("left")}>
            <BackIcon />
          </button>
          <button onClick={share} aria-label="Share" style={roundBtnStyle("right")}>
            <ShareIcon />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 108px" }}>
          <h1 style={{ font: "400 30px/1.12 var(--font-display)", color: "var(--ink)", margin: 0, letterSpacing: "-.01em" }}>
            {spot.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, font: "400 13px/1.4 var(--font-body)", color: "var(--muted)" }}>
            <PinPlaceIcon />
            {spot.area}, Chennai{dist ? ` · ${dist} km away` : ""}
          </div>

          {spot.about ? (
            <div style={{ font: "400 14.5px/1.62 var(--font-body)", color: "var(--ink-soft)", marginTop: 16 }}>
              {renderRichText(spot.about)}
            </div>
          ) : null}

          <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {spot.landmark ? (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ font: "400 12.5px var(--font-body)", color: "var(--muted)" }}>Landmark</span>
                <span style={{ font: "500 12.5px var(--font-body)", color: "var(--ink)", textAlign: "right" }}>{spot.landmark}</span>
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <span style={{ font: "400 12.5px var(--font-body)", color: "var(--muted)" }}>Added by</span>
              <span style={{ font: "500 12.5px var(--font-body)", color: "var(--ink)", textAlign: "right" }}>{spot.submitted_by}</span>
            </div>
          </div>

          {spot.lat != null && spot.lng != null ? (
            <div style={{ marginTop: 18, borderRadius: 16, overflow: "hidden", border: "1px solid var(--line)", height: 120, position: "relative" }}>
              <MapCanvas spots={[spot]} center={[spot.lat, spot.lng]} zoom={15} minimal />
            </div>
          ) : null}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "12px 14px 16px",
            background: "linear-gradient(180deg,rgba(255,252,246,0),#FFFCF6 34%)",
            display: "flex",
            gap: 9,
          }}
        >
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
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

function roundBtnStyle(side) {
  return {
    position: "absolute",
    [side]: 14,
    top: 14,
    width: 38,
    height: 38,
    borderRadius: 13,
    background: "rgba(255,252,246,.94)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 3px 10px rgba(42,27,16,.2)",
  };
}
