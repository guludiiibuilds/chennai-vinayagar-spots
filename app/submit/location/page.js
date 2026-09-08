"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { reverseGeocodeArea } from "@/lib/geo";
import { useToast } from "@/components/ToastProvider";
import { BackIcon, CheckIcon } from "@/components/icons";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "var(--paper)" }} />,
});

const CHENNAI_CENTER = { lat: 13.0067, lng: 80.257 };

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export default function ConfirmLocationPage() {
  const router = useRouter();
  const showToast = useToast();

  // null until we've decided where to first open the map — either the
  // user's real position, or a Chennai-wide fallback if location wasn't
  // available. Nothing renders the (mount-only-centered) map until then.
  const [initialCenter, setInitialCenter] = useState(null);
  const [center, setCenter] = useState(null);
  const [prevCenter, setPrevCenter] = useState(null);
  const [area, setArea] = useState("");
  const [areaLoading, setAreaLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentPosition()
      .then((p) => {
        if (cancelled) return;
        setInitialCenter(p);
        setCenter(p);
      })
      .catch(() => {
        if (cancelled) return;
        showToast("Couldn't get your location — drag the map to set it");
        setInitialCenter(CHENNAI_CENTER);
        setCenter(CHENNAI_CENTER);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset the area-lookup loading flag during render when the map settles
  // on a new center (React's documented pattern for this), rather than as
  // a synchronous setState call inside the effect below.
  if (center !== prevCenter) {
    setPrevCenter(center);
    if (center) setAreaLoading(true);
  }

  useEffect(() => {
    if (!center) return;
    let cancelled = false;
    reverseGeocodeArea(center.lat, center.lng)
      .then((name) => {
        if (!cancelled) setArea(name || "");
      })
      .finally(() => {
        if (!cancelled) setAreaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [center]);

  const confirm = () => {
    if (!center) return;
    const params = new URLSearchParams({ lat: String(center.lat), lng: String(center.lng) });
    if (area) params.set("area", area);
    router.push(`/submit?${params.toString()}`);
  };

  const skip = () => router.push("/submit");

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ animation: "fadeUp .28s ease both" }}>
        <div
          style={{
            position: "relative",
            zIndex: 10,
            flex: "none",
            padding: "16px 18px 14px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--card)",
          }}
        >
          <button
            onClick={() => router.push("/")}
            aria-label="Cancel"
            style={{ width: 36, height: 36, borderRadius: 9999, background: "var(--paper)", display: "grid", placeItems: "center" }}
          >
            <BackIcon />
          </button>
          <div>
            <div style={{ font: "600 17px/1.2 var(--font-body)", letterSpacing: "-.374px", color: "var(--ink)" }}>Confirm Location</div>
            <div style={{ font: "400 11.5px/1.3 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>Drag the map to move the pin.</div>
          </div>
        </div>

        <div style={{ position: "relative", flex: 1, overflow: "hidden", background: "var(--paper)" }}>
          {initialCenter ? (
            <LocationPicker initialCenter={initialCenter} initialZoom={17} onCenterChange={setCenter} />
          ) : null}

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 5,
              background: "var(--card)",
              borderTop: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
              padding: "10px 18px 16px",
              animation: "fadeUp .22s ease both",
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto 12px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ flex: "none", width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--green-tint)", display: "grid", placeItems: "center" }}>
                <CheckIcon width={18} height={18} strokeWidth={3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {areaLoading ? "Looking up area…" : area || "Location set"}
                </div>
                <div style={{ font: "400 12px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>
                  {center ? `${center.lat.toFixed(4)}° N, ${center.lng.toFixed(4)}° E` : ""}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              <button
                onClick={confirm}
                disabled={!center}
                style={{ height: 50, borderRadius: 9999, background: "var(--accent)", color: "#ffffff", font: "400 17px var(--font-body)" }}
              >
                Confirm Location
              </button>
              <button onClick={skip} style={{ height: 36, borderRadius: 9999, color: "var(--muted)", font: "400 13px var(--font-body)" }}>
                Set Location Manually Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
