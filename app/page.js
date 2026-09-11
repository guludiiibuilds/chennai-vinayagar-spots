"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApprovedSpots } from "@/lib/spots";
import { distanceKm, formatDistance } from "@/lib/geo";
import { CloseIcon } from "@/components/icons";
import { SpotListCard } from "@/components/SpotCard";
import MenuSheet from "@/components/MenuSheet";
import SpotSheet from "@/components/SpotSheet";
import SpotPanel from "@/components/SpotPanel";
import PhotoViewer from "@/components/PhotoViewer";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { ViewModeDropdown } from "@/components/ViewModeDropdown";
import { Chip } from "@/components/Chip";
import { PinPlaceIcon } from "@/components/icons";
import MobileOnlyPrompt from "@/components/MobileOnlyPrompt";
import Logo from "@/components/Logo";

// Matches the submit flow's own desktop check (lib/useIsDesktop's default)
// so browsing and submitting switch to "desktop" behavior together —
// tablets stay on the full mobile experience (single-column, map/list
// toggle, and a working submit flow) right up to that same width.
const DESKTOP_BREAKPOINT = 1024;

// "Near me" filter radius — tight enough to stay meaningful in a dense city.
const NEAR_RADIUS_KM = 2;

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
  const [locationStatus, setLocationStatus] = useState("checking"); // "checking" | "granted" | "denied"
  const [selectedId, setSelectedId] = useState(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [mobileOnlyPromptOpen, setMobileOnlyPromptOpen] = useState(false);
  const [filterMode, setFilterMode] = useState(null); // null | "near" | "popular" — exclusive, tap again to clear
  const toggleFilter = (value) => setFilterMode((m) => (m === value ? null : value));
  const searchInputWrapRef = useRef(null);

  useEffect(() => {
    if (searchActive) searchInputWrapRef.current?.querySelector("input")?.focus();
  }, [searchActive]);

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

  // Distance-based features (nearest-first sorting, per-spot distance) are
  // core to browsing here, not an optional enhancement, so location isn't a
  // silent best-effort request anymore — the whole browse view is gated on
  // it (see the locationStatus !== "granted" branch below). beginLocating
  // only ever sets state from the async geolocation callbacks, so the mount
  // effect below can call it without tripping over synchronous setState.
  const beginLocating = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Retry entry point for the "Enable Location" button: resets the status
  // to "checking" first, since by the time it's clicked the state is
  // "denied", not the mount-time default.
  const requestLocation = () => {
    setLocationStatus("checking");
    beginLocating();
  };

  useEffect(() => {
    // beginLocating only sets state synchronously in its "no geolocation
    // API" bailout branch — everything else resolves through the async
    // getCurrentPosition callbacks, which is the pattern this rule wants;
    // it just can't see the branch is a rare environment check, not a
    // render-cascade risk.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    beginLocating();
  }, []);

  const spotsWithDist = useMemo(
    () =>
      spots.map((s) => {
        const distKm = userPos ? distanceKm(userPos, { lat: s.lat, lng: s.lng }) : null;
        return { ...s, distKm };
      }),
    [spots, userPos]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = spotsWithDist;
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q));
    if (filterMode === "near") list = list.filter((s) => s.distKm != null && s.distKm <= NEAR_RADIUS_KM);
    if (filterMode === "popular") list = list.filter((s) => s.is_popular);
    return list;
  }, [spotsWithDist, query, filterMode]);

  const emptyStateProps = filterMode === "near"
    ? { icon: "📍", title: `No spots within ${NEAR_RADIUS_KM}km yet`, description: "Clear the filter to see every spot." }
    : filterMode === "popular"
    ? { icon: "★", title: "No popular spots yet", description: "Check back soon, or clear the filter." }
    : { icon: "🔍", title: "No spots match that search yet", description: "Know one? Add it below." };

  // List views specifically show nearest-first; the map doesn't care about
  // array order since pins are placed by lat/lng, not list position.
  const nearestFirst = useMemo(() => [...filtered].sort((a, b) => (a.distKm ?? Infinity) - (b.distKm ?? Infinity)), [filtered]);

  const selectedSpot = selectedId ? spotsWithDist.find((s) => s.id === selectedId) : null;

  const openSpot = (spot) => {
    setMode("map");
    setSelectedId(spot.id);
  };
  const closeSheet = () => {
    setSelectedId(null);
    setPhotoViewerOpen(false);
  };

  if (locationStatus !== "granted") {
    return (
      <div className="app-shell">
        <div className="app-frame" style={{ alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--accent-tint)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <h1 style={{ font: "600 20px/1.3 var(--font-display)", color: "var(--ink)", marginTop: 18 }}>
            Turn on location to continue
          </h1>
          <p style={{ font: "400 14px/1.55 var(--font-body)", color: "var(--ink-soft)", marginTop: 8, maxWidth: 300 }}>
            Distances, nearby idols, and the map all need to know roughly where you are. Nothing is shared — it stays on your
            device.
          </p>
          <Button variant="primary" onClick={requestLocation} loading={locationStatus === "checking"} style={{ marginTop: 22, height: 48, width: "100%", maxWidth: 260 }}>
            {locationStatus === "checking" ? "Checking…" : "Enable Location"}
          </Button>
          <div style={{ font: "400 12px/1.5 var(--font-body)", color: "var(--muted)", marginTop: 14, maxWidth: 280 }}>
            If nothing happens, allow location access for this site in your browser&apos;s settings, then try again.
          </div>
        </div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="app-shell app-shell--home">
        <div className="app-frame app-frame--home">
          <div className="hp-topbar">
            <Logo size={34} />
            <div style={{ font: "700 11px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 4, letterSpacing: "0.06em" }}>
              Track Vinayagar Chaturthi idols in Chennai ·{" "}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                style={{ color: "var(--accent)", font: "inherit", letterSpacing: "inherit", textTransform: "inherit", background: "none", border: 0, padding: 0, cursor: "pointer" }}
              >
                About
              </button>
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
                  {nearestFirst.map((s) => (
                    <SpotListCard key={s.id} spot={s} distanceLabel={formatDistance(s.distKm)} onOpen={openSpot} />
                  ))}
                  {!loading && filtered.length === 0 ? <EmptyState {...emptyStateProps} /> : null}
                </div>
              )}

              {!selectedSpot ? (
                <div className="hp-sidebar-footer">
                  <Button
                    variant="primary"
                    onClick={() => setMobileOnlyPromptOpen(true)}
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

          {mobileOnlyPromptOpen ? <MobileOnlyPrompt onClose={() => setMobileOnlyPromptOpen(false)} /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--home">
      <div className="app-frame app-frame--home">
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
          {searchActive ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* SearchBar doesn't forward a ref or autoFocus, so this
                  wrapper ref + effect below reaches in for the DOM input
                  directly to focus it the moment the search row appears. */}
              <div ref={searchInputWrapRef} style={{ flex: 1 }}>
                <SearchBar
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search area or idol name"
                />
              </div>
              <IconButton
                variant="soft"
                size="sm"
                label="Close search"
                onClick={() => {
                  setSearchActive(false);
                  setQuery("");
                }}
                icon={<CloseIcon />}
              />
            </div>
          ) : (
            <div>
              <Logo size={60} />
              {!selectedSpot ? (
                <div style={{ font: "700 11px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 4, letterSpacing: "0.06em" }}>
                  Track Vinayagar Chaturthi idols in Chennai ·{" "}
                  <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    style={{ color: "var(--accent)", font: "inherit", letterSpacing: "inherit", textTransform: "inherit", background: "none", border: 0, padding: 0, cursor: "pointer" }}
                  >
                    About
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {!selectedSpot ? (
            // No overflowX here: it clips ViewModeDropdown's absolutely-
            // positioned popup out of existence, since overflow-x on
            // anything but "visible" forces overflow-y to clip too — the
            // whole Map/List menu silently stopped rendering. This row's
            // contents fit comfortably down to a 360px-wide phone without
            // needing to scroll.
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <ViewModeDropdown mode={mode} onChange={setMode} />
              <span style={{ width: 1, height: 20, background: "var(--line-strong)", flex: "none" }} />
              <Chip selected={filterMode === "near"} icon={<PinPlaceIcon stroke="currentColor" />} onClick={() => toggleFilter("near")}>
                Near me
              </Chip>
              <Chip selected={filterMode === "popular"} icon={<span style={{ fontSize: 11 }}>★</span>} onClick={() => toggleFilter("popular")}>
                Popular
              </Chip>
            </div>
          ) : null}
        </header>

        {/* Normal document flow, not position:absolute — so it always stacks
            directly under the header at whatever height the header actually
            is (e.g. with or without the filter-chip row), instead of a
            hardcoded top offset that silently drifts out of sync whenever
            the header's contents change. */}
        {loadError ? (
          <div
            style={{
              flex: "none",
              margin: "10px 14px 0",
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

        {mode === "map" ? (
          <div style={{ position: "relative", zIndex: 1, flex: 1, overflow: "hidden", background: "var(--paper)" }}>
            <MapCanvas
              spots={filtered}
              userPos={userPos}
              onSelect={openSpot}
              selectedId={selectedId}
              focusSpot={selectedSpot}
              focusVerticalFraction={selectedSpot ? 0.2 : undefined}
              onSearchClick={selectedSpot ? undefined : () => setSearchActive(true)}
              onMapClick={selectedSpot ? closeSheet : undefined}
            />
            {/* The map has no rows of its own to show a "no matches" message
                in, unlike list mode — without this, a search or filter with
                zero results just looks like the map silently broke. */}
            {!loading && filtered.length === 0 && !selectedSpot ? (
              <div style={{ position: "absolute", left: 14, right: 14, top: "50%", transform: "translateY(-50%)", zIndex: 8 }}>
                <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow-elevated)" }}>
                  <EmptyState {...emptyStateProps} />
                </div>
              </div>
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
            {nearestFirst.map((s) => (
              <SpotListCard key={s.id} spot={s} distanceLabel={formatDistance(s.distKm)} onOpen={openSpot} />
            ))}
            {!loading && filtered.length === 0 ? <EmptyState {...emptyStateProps} /> : null}
          </div>
        )}

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
