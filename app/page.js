"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApprovedSpots } from "@/lib/spots";
import { distanceKm, formatDistance } from "@/lib/geo";
import { InfoIcon } from "@/components/icons";
import { SpotListCard } from "@/components/SpotCard";
import MenuSheet from "@/components/MenuSheet";
import SpotSheet from "@/components/SpotSheet";
import SpotPanel from "@/components/SpotPanel";
import PhotoViewer from "@/components/PhotoViewer";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Chip } from "@/components/Chip";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";

const DESKTOP_BREAKPOINT = 768;

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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
    return spotsWithDist.filter((s) => s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q));
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

  if (isDesktop) {
    return (
      <div className="app-shell app-shell--home">
        <div className="app-frame app-frame--home">
          <div className="hp-topbar">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ font: "600 22px/1.15 var(--font-display)", letterSpacing: "-.374px" }}>Spot Vinayaka in Chennai</div>
                <div style={{ font: "400 12.5px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>
                  {spots.length} active idol{spots.length === 1 ? "" : "s"}
                </div>
              </div>
              <IconButton variant="soft" size="sm" label="About" onClick={() => setMenuOpen(true)} icon={<InfoIcon />} />
            </div>
          </div>

          <div className="hp-body">
            <div className="hp-sidebar">
              {!selectedSpot ? (
                <div className="hp-sidebar-search">
                  <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search area or idol name" />
                </div>
              ) : null}

              {selectedSpot ? (
                <SpotPanel
                  spot={selectedSpot}
                  distanceLabel={formatDistance(selectedSpot.distKm)}
                  onBack={closeSheet}
                  onOpenPhoto={() => setPhotoViewerOpen(true)}
                />
              ) : (
                <div className="hp-sidebar-list">
                  {filtered.map((s) => (
                    <SpotListCard key={s.id} spot={s} distanceLabel={formatDistance(s.distKm)} onOpen={openSpot} />
                  ))}
                  {!loading && filtered.length === 0 ? (
                    <EmptyState icon="🔍" title="No spots match that search yet" description="Know one? Add it below." />
                  ) : null}
                </div>
              )}

              {!selectedSpot ? (
                <div className="hp-sidebar-footer">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/submit/location")}
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14"></path>
                      </svg>
                    }
                    style={{ width: "100%" }}
                  >
                    Spot a Vinayaka
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="hp-map-pane">
              <MapCanvas spots={filtered} userPos={userPos} onSelect={openSpot} selectedId={selectedId} focusSpot={selectedSpot} />
              {loadError ? (
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    top: 16,
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
            </div>
          </div>

          <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />

          {photoViewerOpen && selectedSpot ? <PhotoViewer spot={selectedSpot} onClose={() => setPhotoViewerOpen(false)} /> : null}
        </div>
      </div>
    );
  }

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
              <div style={{ font: "600 21px/1.15 var(--font-display)", letterSpacing: "-.374px" }}>Spot Vinayaka in Chennai</div>
              {!selectedSpot ? (
                <div style={{ font: "400 12.5px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>
                  {spots.length} active idol{spots.length === 1 ? "" : "s"}
                </div>
              ) : null}
            </div>
            <IconButton variant="soft" size="sm" label="About" onClick={() => setMenuOpen(true)} icon={<InfoIcon />} />
          </div>

          {!selectedSpot ? (
            <div style={{ marginTop: 14 }}>
              <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search area or idol name" />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <Chip selected={mode === "map"} onClick={() => setMode("map")}>Map</Chip>
                <Chip selected={mode === "list"} onClick={() => setMode("list")}>List</Chip>
              </div>
            </div>
          ) : null}
        </header>

        {mode === "map" ? (
          <div style={{ position: "relative", zIndex: 1, flex: 1, overflow: "hidden", background: "var(--paper)" }}>
            <MapCanvas spots={filtered} userPos={userPos} onSelect={openSpot} selectedId={selectedId} focusSpot={selectedSpot} />
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
              <EmptyState icon="🔍" title="No spots match that search yet" description="Know one? Add it below." />
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
          <Button
            variant="primary"
            onClick={() => router.push("/submit/location")}
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            }
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 16,
              zIndex: 8,
              height: 50,
              boxShadow: "var(--shadow-floating)",
            }}
          >
            Spot a Vinayaka
          </Button>
        ) : null}

        <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />

        {photoViewerOpen && selectedSpot ? (
          <PhotoViewer spot={selectedSpot} onClose={() => setPhotoViewerOpen(false)} />
        ) : null}
      </div>
    </div>
  );
}
