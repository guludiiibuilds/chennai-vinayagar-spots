"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { fetchApprovedSpots } from "@/lib/spots";
import { distanceKm, formatDistance } from "@/lib/geo";
import { SearchIcon, MenuIcon } from "@/components/icons";
import { SpotListCard, SpotCarouselCard } from "@/components/SpotCard";
import MenuSheet from "@/components/MenuSheet";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "#F4EADA" }} />,
});

export default function HomePage() {
  const router = useRouter();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("map");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchApprovedSpots()
      .then((data) => {
        if (!cancelled) setSpots(data);
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
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withDist = spots.map((s) => ({
      ...s,
      distKm: userPos ? distanceKm(userPos, { lat: s.lat, lng: s.lng }) : null,
    }));
    if (!q) return withDist;
    return withDist.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.theme.toLowerCase().includes(q)
    );
  }, [spots, query, userPos]);

  const goToSpot = (spot) => router.push(`/spot/${spot.id}`);

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header
          style={{
            position: "relative",
            zIndex: 6,
            padding: "16px 18px 12px",
            background: "linear-gradient(180deg,#C77E0A,#B0670A)",
            color: "#FFF6E6",
            flex: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ font: "800 21px/1.15 var(--font-body)", letterSpacing: "-.02em" }}>Spot Vinayagar in Chennai</div>
              <div style={{ font: "400 12.5px/1.4 var(--font-body)", color: "rgba(255,246,230,.82)", marginTop: 2 }}>
                {spots.length} active pandal{spots.length === 1 ? "" : "s"}
              </div>
            </div>
            <button
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
              style={{
                flex: "none",
                width: 34,
                height: 34,
                borderRadius: 12,
                background: "rgba(255,246,230,.16)",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255,246,230,.24)",
              }}
            >
              <MenuIcon />
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,252,246,.95)",
                borderRadius: 12,
                padding: "9px 12px",
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
                  font: "400 13.5px var(--font-body)",
                  color: "var(--ink)",
                  width: "100%",
                }}
              />
            </div>
            <div style={{ display: "flex", background: "rgba(42,27,16,.22)", borderRadius: 12, padding: 3, flex: "none" }}>
              <button onClick={() => setMode("map")} style={tabStyle(mode === "map")}>
                Map
              </button>
              <button onClick={() => setMode("list")} style={tabStyle(mode === "list")}>
                List
              </button>
            </div>
          </div>
        </header>

        {mode === "map" ? (
          <div style={{ position: "relative", zIndex: 1, flex: 1, overflow: "hidden", background: "#F4EADA" }}>
            <MapCanvas spots={filtered} userPos={userPos} onSelect={goToSpot} />
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
                  <SpotCarouselCard key={s.id} spot={s} distanceLabel={formatDistance(s.distKm)} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", background: "var(--card)", padding: "14px 14px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((s) => (
              <SpotListCard key={s.id} spot={s} distanceLabel={formatDistance(s.distKm)} />
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
              borderRadius: 12,
              background: "#FFF3DF",
              color: "#7E3B0F",
              font: "500 12px/1.4 var(--font-body)",
            }}
          >
            Couldn&apos;t load spots ({loadError}). Check the Supabase project is reachable and the schema has been applied.
          </div>
        ) : null}

        <button
          onClick={() => router.push("/submit")}
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 16,
            zIndex: 8,
            height: 54,
            borderRadius: 16,
            color: "#FFF6E6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            font: "600 15px var(--font-body)",
            background: "var(--ochre)",
            boxShadow: "0 10px 26px -8px rgba(199,126,10,.7)",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFF6E6" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Spot a Vinayagar
        </button>

        <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </div>
  );
}

function tabStyle(active) {
  return {
    padding: "7px 13px",
    borderRadius: 9,
    font: "600 12.5px var(--font-body)",
    background: active ? "#FFFCF6" : "transparent",
    color: active ? "#8E1B15" : "rgba(255,246,230,.85)",
  };
}
