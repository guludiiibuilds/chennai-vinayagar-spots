"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApprovedSpots } from "@/lib/spots";
import { distanceKm, formatDistance } from "@/lib/geo";
import { SearchIcon, InfoIcon } from "@/components/icons";
import { SpotListCard, SpotCarouselCard } from "@/components/SpotCard";
import MenuSheet from "@/components/MenuSheet";
import SpotSheet from "@/components/SpotSheet";
import PhotoViewer from "@/components/PhotoViewer";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "var(--paper)" }} />,
});

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("map");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchApprovedSpots()
      .then((data) => {
        if (cancelled) return;
        setSpots(data);
        // Deep link support: a shared "/?spot=<id>" link opens straight
        // into that spot's sheet once the list has loaded.
        const wanted = searchParams.get("spot");
        if (wanted && data.some((s) => s.id === wanted)) {
          setMode("map");
          setSelectedId(wanted);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Could not load spots");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const spotsWithDist = useMemo(
    () =>
      spots.map((s) => ({
        ...s,
        distKm: userPos ? distanceKm(userPos, { lat: s.lat, lng: s.lng }) : null,
      })),
    [spots, userPos]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spotsWithDist;
    return spotsWithDist.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.theme.toLowerCase().includes(q)
    );
  }, [spotsWithDist, query]);

  const selectedSpot = selectedId ? spotsWithDist.find((s) => s.id === selectedId) : null;

  const openSpot = (spot) => {
    setMode("map");
    setSelectedId(spot.id);
  };
  const closeSheet = () => {
    setSelectedId(null);
    setPhotoViewerOpen(false);
  };

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header
          style={{
            position: "relative",
            zIndex: 6,
            padding: selectedSpot ? "16px 18px" : "16px 18px 12px",
            background: "var(--card)",
            borderBottom: "1px solid var(--line)",
            color: "var(--ink)",
            flex: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ font: "600 21px/1.15 var(--font-display)", letterSpacing: "-.374px" }}>Spot Vinayagar in Chennai</div>
              {!selectedSpot ? (
                <div style={{ font: "400 12.5px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>
                  {spots.length} active pandal{spots.length === 1 ? "" : "s"}
                </div>
              ) : null}
            </div>
            <button
              aria-label="About"
              onClick={() => setMenuOpen(true)}
              style={{
                flex: "none",
                width: 34,
                height: 34,
                borderRadius: 9999,
                background: "var(--paper)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <InfoIcon />
            </button>
          </div>

          {!selectedSpot ? (
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <div
                className="field-wrap"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--paper)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: 9999,
                  padding: "9px 14px",
                }}
              >
                <SearchIcon />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search area or pandal name"
                  style={{
                    border: 0,
                    outline: 0,
                    background: "transparent",
                    font: "400 16px var(--font-body)",
                    color: "var(--ink)",
                    width: "100%",
                  }}
                />
              </div>
              <div style={{ display: "flex", background: "var(--paper)", borderRadius: 9999, padding: 3, flex: "none" }}>
                <button onClick={() => setMode("map")} style={tabStyle(mode === "map")}>
                  Map
                </button>
                <button onClick={() => setMode("list")} style={tabStyle(mode === "list")}>
                  List
                </button>
              </div>
            </div>
          ) : null}
        </header>

        {mode === "map" ? (
          <div style={{ position: "relative", zIndex: 1, flex: 1, overflow: "hidden", background: "var(--paper)" }}>
            <MapCanvas spots={filtered} userPos={userPos} onSelect={openSpot} selectedId={selectedId} focusSpot={selectedSpot} />
            {!selectedSpot ? (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 0 84px", zIndex: 2, pointerEvents: "none" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    padding: "10px 20px",
                    pointerEvents: "auto",
                  }}
                >
                  {filtered.map((s) => (
                    <SpotCarouselCard key={s.id} spot={s} distanceLabel={formatDistance(s.distKm)} onOpen={openSpot} />
                  ))}
                </div>
              </div>
            ) : null}
            {selectedSpot ? (
              <div onClick={closeSheet} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: "60%", zIndex: 3 }} />
            ) : null}
            {selectedSpot ? (
              <SpotSheet
                spot={selectedSpot}
                distanceLabel={formatDistance(selectedSpot.distKm)}
                onClose={closeSheet}
                onOpenPhoto={() => setPhotoViewerOpen(true)}
              />
            ) : null}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", background: "var(--card)", padding: "14px 14px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((s) => (
              <SpotListCard key={s.id} spot={s} distanceLabel={formatDistance(s.distKm)} onOpen={openSpot} />
            ))}
            {!loading && filtered.length === 0 ? (
              <div style={{ padding: "38px 20px", textAlign: "center", font: "400 13px/1.6 var(--font-body)", color: "var(--muted)" }}>
                No spots match that search yet.
                <br />
                Know one? Add it below.
              </div>
            ) : null}
          </div>
        )}

        {loadError ? (
          <div
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              top: 132,
              zIndex: 20,
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--card)",
              border: "1px solid var(--line-strong)",
              borderLeft: "3px solid var(--pin)",
              color: "var(--ink-soft)",
              font: "400 12px/1.4 var(--font-body)",
            }}
          >
            Couldn&apos;t load spots ({loadError}). Check the Supabase project is reachable and the schema has been applied.
          </div>
        ) : null}

        {!selectedSpot ? (
          <button
            onClick={() => router.push("/submit")}
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 16,
              zIndex: 8,
              height: 50,
              borderRadius: 9999,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              font: "400 17px var(--font-body)",
              background: "var(--accent)",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Spot a Vinayagar
          </button>
        ) : null}

        <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />

        {photoViewerOpen && selectedSpot ? (
          <PhotoViewer spot={selectedSpot} onClose={() => setPhotoViewerOpen(false)} />
        ) : null}
      </div>
    </div>
  );
}

function tabStyle(active) {
  return {
    padding: "7px 13px",
    borderRadius: 9999,
    font: "400 12.5px var(--font-body)",
    background: active ? "var(--card)" : "transparent",
    color: active ? "var(--ink)" : "var(--muted)",
  };
}
