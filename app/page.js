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
import { useToast } from "@/components/ToastProvider";
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
  // "unknown" — not yet granted, but the browser hasn't been asked (or its
  // answer isn't known yet) so an action that needs location can still
  // trigger a real permission prompt. "blocked" — the browser has already
  // recorded a denial for this site, so requesting again silently no-ops;
  // only the user changing their browser's site settings fixes that.
  const [locationStatus, setLocationStatus] = useState("unknown"); // "unknown" | "granted" | "blocked"
  const showToast = useToast();
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

  // Browsing (map/list) never blocks on location — distance labels and
  // "Near me" just stay unavailable until it's granted. beginLocating is
  // the one place that actually calls the geolocation API; a permission
  // error's code 1 (PERMISSION_DENIED) means the browser won't prompt
  // again on its own, so that's the only case marked "blocked" rather
  // than left "unknown". onDone (optional) gets the resulting status —
  // callers that need to react to the outcome can't just read
  // `locationStatus` afterward, since the setState above hasn't applied
  // yet in that same tick.
  const beginLocating = (onDone) => {
    if (!navigator.geolocation) {
      setLocationStatus("blocked");
      onDone?.("blocked");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
        onDone?.("granted");
      },
      (err) => {
        const next = err?.code === 1 ? "blocked" : "unknown";
        setLocationStatus(next);
        onDone?.(next);
      },
      // enableHighAccuracy forces a GPS-only fix — on Android especially, a
      // cold GPS lock (first request in a session, or indoors) routinely
      // takes longer than this timeout, so the first tap on the FAB/"Near
      // me" would fail and only a retry (once the GPS chip had warmed up in
      // the background) would succeed. A network-based fix resolves in a
      // second or two and is plenty precise for a 2km "near me" radius or
      // seeding the draggable map pin — nothing here needs GPS-grade accuracy.
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  // Gate for any action that needs a real position (the FAB, "Near me").
  // Runs it immediately if location is already known to be granted;
  // otherwise it always genuinely asks the browser first — never just
  // shows a "not enabled" message off a stale guess — and only reports a
  // problem if that request actually fails. This matters because the
  // up-front Permissions API check below isn't reliable everywhere (Safari
  // doesn't support querying the geolocation permission at all), so
  // `locationStatus` can still read "unknown" here even when location is
  // genuinely already granted; asking directly resolves near-instantly in
  // that case (no prompt shown, since the browser already has an answer)
  // and the action proceeds right away, exactly as if it had been granted
  // the whole time.
  const requireLocation = (action) => {
    if (locationStatus === "granted") {
      action();
      return;
    }
    beginLocating((status) => {
      if (status === "granted") {
        action();
        return;
      }
      showToast(
        status === "blocked"
          ? "Location is blocked for this site — allow it in your browser settings, then try again."
          : "Turn on location to use this, then try again."
      );
    });
  };

  useEffect(() => {
    // Best-effort silent check so a returning visitor sees distances/"Near
    // me" work without needing to tap anything first — but it's not load-
    // bearing for correctness (requireLocation above never trusts a stale
    // "not granted" reading), only for this opportunistic early fetch. Not
    // supported in every browser (notably Safari, for geolocation), in
    // which case this just quietly does nothing and the first real
    // location-requiring tap handles it instead.
    let cancelled = false;
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (!cancelled && result.state === "granted") beginLocating();
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
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

  // Carries the position Home already has (requireLocation only runs this
  // once locationStatus is "granted", so userPos is set) into the confirm-
  // location screen as a starting point — without it, that screen has no
  // idea a position was already found here and requests a brand new GPS
  // fix from scratch, which is the slow part users were seeing as a delay.
  const goToSubmitLocation = () => {
    const params = userPos ? `?lat=${userPos.lat}&lng=${userPos.lng}` : "";
    router.push(`/submit/location${params}`);
  };

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
            <Logo size={28} />
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
                    Spot a Vinayagar
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
              <Logo size={28} />
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
              <Chip selected={filterMode === "near"} icon={<PinPlaceIcon stroke="currentColor" />} onClick={() => requireLocation(() => toggleFilter("near"))}>
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
              showControls={!selectedSpot}
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
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, zIndex: 8, display: "flex", justifyContent: "center" }}>
            <Button
              variant="primary"
              onClick={() => requireLocation(goToSubmitLocation)}
              icon={
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
              }
              style={{
                height: 50,
                paddingLeft: 28,
                paddingRight: 28,
                whiteSpace: "nowrap",
                boxShadow: "var(--shadow-floating)",
              }}
            >
              Spot a Vinayagar
            </Button>
          </div>
        ) : null}

        <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />

        {photoViewerOpen && selectedSpot ? (
          <PhotoViewer spot={selectedSpot} onClose={() => setPhotoViewerOpen(false)} />
        ) : null}
      </div>
    </div>
  );
}
