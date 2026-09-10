"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { DUPLICATE_RADIUS_KM, findNearestSpot, reverseGeocodeArea } from "@/lib/geo";
import { fetchApprovedSpots } from "@/lib/spots";
import { useToast } from "@/components/ToastProvider";
import { CloseIcon, CheckIcon } from "@/components/icons";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import DuplicateSpotSheet from "@/components/DuplicateSpotSheet";

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

// Full-bleed map with a fixed center pin (see LocationPicker) plus a single
// consolidated bottom sheet carrying the title, live area/coordinates, and
// actions. Used both as the standalone /submit/location entry screen and,
// re-mounted with the submit form's current location, as an in-page
// overlay when someone taps "Change Location" there.
export default function LocationConfirmSheet({
  initialCenter = null,
  initialArea = "",
  title = "Confirm Location",
  subtitle = "Drag the map to move the pin.",
  confirmLabel = "Confirm Location",
  onConfirm,
  onClose,
  onSkip,
}) {
  const showToast = useToast();
  const [center, setCenter] = useState(initialCenter);
  const [prevCenter, setPrevCenter] = useState(initialCenter);
  const [area, setArea] = useState(initialArea);
  const [areaLoading, setAreaLoading] = useState(false);
  const arrivedWithArea = useRef(!!initialArea);
  const [existingSpots, setExistingSpots] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { spot, onContinue }

  // Best-effort: used only to warn about a likely duplicate, so a failed
  // fetch here just means that check gets silently skipped.
  useEffect(() => {
    let cancelled = false;
    fetchApprovedSpots()
      .then((data) => {
        if (!cancelled) setExistingSpots(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirmClick = () => {
    const nearest = findNearestSpot(center, existingSpots);
    if (nearest && nearest.distKm <= DUPLICATE_RADIUS_KM) {
      setDuplicateWarning({
        spot: nearest,
        onContinue: () => {
          setDuplicateWarning(null);
          onConfirm(center, area);
        },
      });
      return;
    }
    onConfirm(center, area);
  };

  useEffect(() => {
    if (center) return; // already have a starting point (e.g. re-opened to change an existing location)
    let cancelled = false;
    getCurrentPosition()
      .then((p) => {
        if (!cancelled) setCenter(p);
      })
      .catch(() => {
        if (cancelled) return;
        showToast("Couldn't get your location — drag the map to set it");
        setCenter(CHENNAI_CENTER);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset the area-lookup loading flag during render when the map settles
  // on a new center (React's documented pattern for this), rather than as
  // a synchronous setState call inside the effect below. Refs can't be read
  // during render, so this doesn't try to skip the flag for the
  // already-known-area case — the effect below clears it again immediately
  // when that applies.
  if (center !== prevCenter) {
    setPrevCenter(center);
    if (center) setAreaLoading(true);
  }

  useEffect(() => {
    if (!center) return;
    if (arrivedWithArea.current) {
      arrivedWithArea.current = false; // only the initial, already-known center skips the lookup
      setAreaLoading(false);
      return;
    }
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

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 15, background: "var(--paper)" }}>
      {center ? <LocationPicker initialCenter={center} initialZoom={17} onCenterChange={setCenter} /> : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          background: "var(--card)",
          borderTop: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          boxShadow: "var(--shadow-lg)",
          padding: "10px 18px 16px",
          animation: "fadeUp .22s ease both",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto 12px" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ font: "600 19px/1.2 var(--font-display)", letterSpacing: "-.374px", color: "var(--ink)" }}>{title}</div>
            <div style={{ font: "400 12.5px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 3 }}>{subtitle}</div>
          </div>
          <IconButton variant="soft" size="sm" label="Close" onClick={onClose} icon={<CloseIcon />} style={{ borderRadius: 10 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 14 }}>
          <div style={{ flex: "none", width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--green-tint)", display: "grid", placeItems: "center" }}>
            <CheckIcon width={18} height={18} strokeWidth={3} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {!center ? "Finding your location…" : areaLoading ? "Looking up area…" : area || "Location set"}
            </div>
            <div style={{ font: "400 12px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>
              {center ? `${center.lat.toFixed(4)}° N, ${center.lng.toFixed(4)}° E` : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          <Button variant="primary" onClick={handleConfirmClick} disabled={!center} style={{ height: 50 }}>
            {confirmLabel}
          </Button>
          {onSkip ? (
            <Button variant="outline" onClick={onSkip} style={{ height: 46 }}>
              Set Location Manually Instead
            </Button>
          ) : null}
        </div>
      </div>

      <DuplicateSpotSheet
        spot={duplicateWarning?.spot}
        onCancel={() => setDuplicateWarning(null)}
        onContinue={duplicateWarning?.onContinue}
      />
    </div>
  );
}
