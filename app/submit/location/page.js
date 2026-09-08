"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { reverseGeocodeArea } from "@/lib/geo";
import { BackIcon, CompassIcon, CheckIcon } from "@/components/icons";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "var(--paper)" }} />,
});

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location isn't available on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export default function ConfirmLocationPage() {
  const router = useRouter();
  const [status, setStatus] = useState("locating"); // locating | ready | denied
  const [pos, setPos] = useState(null);
  const [prevPos, setPrevPos] = useState(pos);
  const [area, setArea] = useState("");
  const [areaLoading, setAreaLoading] = useState(false);

  // Reset the area-lookup loading flag during render when a new position
  // arrives (React's documented pattern for this), rather than as a
  // synchronous setState call inside the effect below.
  if (pos !== prevPos) {
    setPrevPos(pos);
    setAreaLoading(!!pos);
  }

  useEffect(() => {
    let cancelled = false;
    getCurrentPosition()
      .then((p) => {
        if (cancelled) return;
        setPos(p);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pos) return;
    let cancelled = false;
    reverseGeocodeArea(pos.lat, pos.lng)
      .then((name) => {
        if (!cancelled && name) setArea(name);
      })
      .finally(() => {
        if (!cancelled) setAreaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pos]);

  const tryAgain = () => {
    setStatus("locating");
    getCurrentPosition()
      .then((p) => {
        setPos(p);
        setStatus("ready");
      })
      .catch(() => setStatus("denied"));
  };

  const confirm = () => {
    if (!pos) return;
    const params = new URLSearchParams({ lat: String(pos.lat), lng: String(pos.lng) });
    if (area) params.set("area", area);
    router.push(`/submit?${params.toString()}`);
  };

  const skip = () => router.push("/submit");

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ animation: "fadeUp .28s ease both" }}>
        <div style={{ flex: "none", padding: "16px 18px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/")}
            aria-label="Cancel"
            style={{ width: 36, height: 36, borderRadius: 9999, background: "var(--paper)", display: "grid", placeItems: "center" }}
          >
            <BackIcon />
          </button>
          <div>
            <div style={{ font: "600 17px/1.2 var(--font-body)", letterSpacing: "-.374px", color: "var(--ink)" }}>Confirm Location</div>
            <div style={{ font: "400 11.5px/1.3 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>
              We&apos;ll use this to place your Vinayaka on the map.
            </div>
          </div>
        </div>

        {status === "locating" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 34, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-tint)", display: "grid", placeItems: "center" }}>
              <CompassIcon width={28} height={28} />
            </div>
            <div style={{ font: "600 16px var(--font-body)", color: "var(--ink)", marginTop: 18 }}>Finding your location…</div>
            <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--muted)", marginTop: 6, maxWidth: 260 }}>
              Allow location access when your browser asks, so we can pinpoint where you&apos;re standing.
            </div>
            <button onClick={skip} style={{ marginTop: 22, font: "400 13.5px var(--font-body)", color: "var(--accent)" }}>
              Skip — I&apos;ll set location manually
            </button>
          </div>
        ) : status === "denied" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 34, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--paper)", display: "grid", placeItems: "center" }}>
              <CompassIcon width={28} height={28} stroke="#7a7a7a" />
            </div>
            <div style={{ font: "600 16px var(--font-body)", color: "var(--ink)", marginTop: 18 }}>Couldn&apos;t get your location</div>
            <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--muted)", marginTop: 6, maxWidth: 260 }}>
              Check your browser&apos;s location permission, or set the location yourself on the next screen.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22, width: "100%", maxWidth: 280 }}>
              <button
                onClick={tryAgain}
                style={{ height: 48, borderRadius: 9999, background: "var(--accent)", color: "#ffffff", font: "400 15.5px var(--font-body)" }}
              >
                Try Again
              </button>
              <button onClick={skip} style={{ height: 44, borderRadius: 9999, font: "400 14px var(--font-body)", color: "var(--ink-soft)" }}>
                Continue Without Location
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
              <MapCanvas spots={[{ id: "me", lat: pos.lat, lng: pos.lng }]} selectedId="me" userPos={pos} initialZoom={17} />
            </div>
            <div style={{ flex: "none", padding: "16px 18px", borderTop: "1px solid var(--line)", background: "var(--card)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ flex: "none", width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--green-tint)", display: "grid", placeItems: "center" }}>
                  <CheckIcon width={18} height={18} strokeWidth={3} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>{areaLoading ? "Looking up area…" : area || "Location found"}</div>
                  <div style={{ font: "400 12px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>
                    {pos.lat.toFixed(4)}° N, {pos.lng.toFixed(4)}° E
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 16 }}>
                <button
                  onClick={confirm}
                  style={{ height: 50, borderRadius: 9999, background: "var(--accent)", color: "#ffffff", font: "400 17px var(--font-body)" }}
                >
                  Confirm & Continue
                </button>
                <button onClick={skip} style={{ height: 40, borderRadius: 9999, color: "var(--muted)", font: "400 13.5px var(--font-body)" }}>
                  Set Location Manually Instead
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
