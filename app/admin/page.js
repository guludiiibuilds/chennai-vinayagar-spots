"use client";

import { useEffect, useState } from "react";
import { googleMapsUrl } from "@/lib/geo";
import { uploadSpotPhoto } from "@/lib/spots";
import { compressImage } from "@/lib/image";
import { extractLatLng, isShortGoogleMapsLink, looksLikeGoogleMapsLink } from "@/lib/googleMapsLink";
import { parseCsv, toCsv } from "@/lib/csv";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { TextField } from "@/components/TextField";

// Metadata exports are ignored in files with "use client" — noindex for
// this route is set via app/admin/layout.js instead.

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

async function fetchSpotsOnce(status) {
  const res = await fetch(`/api/admin/spots?status=${status}`, { cache: "no-store" });
  if (res.status === 401) {
    const err = new Error("Not signed in");
    err.unauthorized = true;
    throw err;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load spots");
  return data.spots;
}

// Pure fetch helper with no setState of its own, so it can be safely
// awaited both from an Effect (whose own setState calls must stay inside
// the returned promise's .then/.catch, not synchronous in the Effect body)
// and from event handlers (login) where synchronous setState is fine.
//
// This route occasionally fails with a transient 5xx / bad-gateway-style
// error — the identical request usually succeeds seconds later, so one
// quiet retry smooths over that instead of surfacing a scary "Bad Gateway"
// banner for something that clears up on its own. A real "not signed in"
// isn't transient, so that one skips the retry and fails immediately.
async function fetchSpotsByStatus(status) {
  try {
    return await fetchSpotsOnce(status);
  } catch (err) {
    if (err.unauthorized) throw err;
    await new Promise((resolve) => setTimeout(resolve, 700));
    return fetchSpotsOnce(status);
  }
}

// Shared by AddSpotForm and BulkImportForm below: turns a pasted Google
// Maps link into coordinates, resolving a short maps.app.goo.gl share
// link server-side first if that's what was pasted. Returns null for
// anything that isn't recognized or couldn't be resolved.
async function resolveGoogleMapsLocation(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;
  const direct = extractLatLng(trimmed);
  if (direct) return direct;
  if (!isShortGoogleMapsLink(trimmed)) return null;
  try {
    const res = await fetch("/api/admin/resolve-maps-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? extractLatLng(data.resolvedUrl) : null;
  } catch {
    return null;
  }
}

async function fetchStatsOnce() {
  const res = await fetch("/api/admin/stats", { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.pageViews;
}

// Same transient-failure retry as fetchSpotsByStatus above — this one has
// no error UI at all (the tile just doesn't render), so without a retry a
// passing blip would make the stat silently vanish instead of showing.
async function fetchStats() {
  const first = await fetchStatsOnce();
  if (first !== null) return first;
  await new Promise((resolve) => setTimeout(resolve, 700));
  return fetchStatsOnce();
}

export default function AdminPage() {
  const showToast = useToast();
  const [authed, setAuthed] = useState(null); // null = checking
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState("pending");
  const [prevTab, setPrevTab] = useState(tab);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageViews, setPageViews] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Reset the loading/error state for the newly selected tab during render
  // itself (React's documented pattern for "adjusting state when a prop
  // changes") rather than in an Effect, so there's no synchronous setState
  // inside an Effect body.
  if (tab !== prevTab) {
    setPrevTab(tab);
    setLoading(true);
    setLoadError("");
  }

  useEffect(() => {
    let cancelled = false;
    fetchSpotsByStatus(tab)
      .then((data) => {
        if (cancelled) return;
        setAuthed(true);
        setSpots(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.unauthorized) setAuthed(false);
        else setLoadError(err.message || "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  // Fires once whenever a session becomes authenticated — whether from a
  // fresh login below or an already-valid cookie on page load (the tab
  // effect above is what flips `authed` to true in that second case).
  useEffect(() => {
    if (authed) fetchStats().then(setPageViews);
  }, [authed]);

  const login = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      setPassword("");
      setLoading(true);
      const data = await fetchSpotsByStatus(tab);
      setAuthed(true);
      setSpots(data);
    } catch (err) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoggingIn(false);
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setSpots([]);
    setPageViews(null);
  };

  const updateSpotLocal = (id, patch) => {
    setSpots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const saveSpot = async (spot, extra = {}) => {
    const res = await fetch(`/api/admin/spots/${spot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: spot.name,
        area: spot.area,
        about: spot.about,
        maps_link: spot.maps_link,
        is_popular: spot.is_popular,
        ...extra,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "Save failed");
      return;
    }
    // A status-changing action moves the spot out of the currently viewed
    // tab; a plain save keeps it in place with the server's saved values.
    if (extra.action) {
      setSpots((prev) => prev.filter((s) => s.id !== spot.id));
    } else if (data.spot) {
      updateSpotLocal(spot.id, data.spot);
    }
  };

  const handleCreated = (spot) => {
    setShowAddForm(false);
    showToast(`Added "${spot.name}"`);
    if (tab === "approved") {
      setSpots((prev) => [spot, ...prev]);
    } else {
      setTab("approved");
    }
  };

  // Called once at the end of a whole CSV import (not per-row) — a
  // callback fired from inside the row-by-row import loop would close over
  // whatever `tab` was when the loop started, which goes stale the moment
  // this component re-renders mid-import.
  const handleBulkImported = (createdSpots) => {
    if (createdSpots.length === 0) return;
    if (tab === "approved") {
      setSpots((prev) => [...createdSpots, ...prev]);
    } else {
      setTab("approved");
    }
  };

  const deleteSpot = async (spot) => {
    if (!confirm(`Permanently delete "${spot.name}"? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/spots/${spot.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Delete failed");
      return;
    }
    setSpots((prev) => prev.filter((s) => s.id !== spot.id));
  };

  if (authed === null) {
    return <div style={{ minHeight: "100vh", background: "var(--paper)" }} />;
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--paper)", padding: 24 }}>
        <form
          onSubmit={login}
          style={{
            width: "100%",
            maxWidth: 320,
            background: "var(--card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-lg)",
            padding: 28,
          }}
        >
          <div style={{ font: "600 19px/1.3 var(--font-display)", color: "var(--ink)" }}>Admin sign in</div>
          <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--muted)", marginTop: 6 }}>
            Enter the review-queue password.
          </div>
          <input
            className="field-input"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: "100%",
              height: 46,
              marginTop: 18,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line-strong)",
              background: "var(--card)",
              padding: "0 14px",
              font: "400 16px var(--font-body)",
              color: "var(--ink)",
              outline: 0,
            }}
          />
          {loginError ? (
            <div style={{ font: "400 12.5px/1.4 var(--font-body)", color: "var(--pin-active)", marginTop: 10 }}>{loginError}</div>
          ) : null}
          {/* Button renders a plain <button> with no type attribute, which
              defaults to type="submit" inside a <form> — same behavior as
              the native submit button this replaced, via the form's
              onSubmit={login} below. */}
          <Button variant="primary" disabled={loggingIn || !password} loading={loggingIn} style={{ width: "100%", height: 46, marginTop: 16 }}>
            {loggingIn ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--card)",
          borderBottom: "1px solid var(--line-strong)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ font: "600 20px/1.2 var(--font-display)", color: "var(--ink)" }}>Spot review queue</div>
          <div style={{ font: "400 12.5px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>
            Not linked from the app — bookmark this page.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pageViews !== null ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                lineHeight: 1.2,
                padding: "4px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line-strong)",
                background: "var(--paper)",
              }}
            >
              <span style={{ font: "700 15px var(--font-display)", color: "var(--ink)" }}>{pageViews.toLocaleString()}</span>
              <span style={{ font: "400 10.5px var(--font-body)", color: "var(--muted)" }}>total visits</span>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 6 }}>
            {TABS.map((t) => (
              <Chip key={t.key} selected={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </Chip>
            ))}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowAddForm((v) => !v);
              setShowBulkImport(false);
            }}
            style={{ height: 36 }}
          >
            {showAddForm ? "Cancel" : "+ Add spot"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowBulkImport((v) => !v);
              setShowAddForm(false);
            }}
            style={{ height: 36 }}
          >
            {showBulkImport ? "Cancel" : "Bulk import"}
          </Button>
          <Button variant="outline" size="sm" onClick={logout} style={{ height: 36 }}>
            Log out
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "22px 20px 60px" }}>
        {showAddForm ? <AddSpotForm onCreated={handleCreated} onCancel={() => setShowAddForm(false)} /> : null}
        {showBulkImport ? <BulkImportForm onImported={handleBulkImported} onCancel={() => setShowBulkImport(false)} /> : null}

        {loadError ? (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--card)", border: "1px solid var(--line-strong)", borderLeft: "3px solid var(--pin)", color: "var(--ink-soft)", font: "400 13px/1.4 var(--font-body)", marginBottom: 16 }}>
            {loadError}
          </div>
        ) : null}

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", font: "400 14px var(--font-body)", color: "var(--muted)" }}>Loading…</div>
        ) : spots.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", font: "400 14px var(--font-body)", color: "var(--muted)" }}>
            No {tab} spots right now.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {spots.map((spot) => (
              <SpotReviewCard
                key={spot.id}
                spot={spot}
                onChange={(patch) => updateSpotLocal(spot.id, patch)}
                onSave={() => saveSpot(spot)}
                onAction={(action) => saveSpot(spot, { action })}
                onDelete={() => deleteSpot(spot)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const emptyDraft = { name: "", area: "", about: "", mapsLink: "", isPopular: false };

// Admin-only "add a spot directly" path — the spot is created already
// approved (see the POST handler), skipping the public submit-then-review
// queue entirely. Location is entered by pasting a Google Maps link rather
// than dragging a pin, since that's what an admin typically already has in
// hand (a link shared from the Maps app) rather than standing at the spot.
function AddSpotForm({ onCreated, onCancel }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [loc, setLoc] = useState(null); // { lat, lng } resolved from mapsLink
  const [locStatus, setLocStatus] = useState(""); // "", "checking", "found", "not-found"
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const showToast = useToast();

  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const resolveLocation = async () => {
    const text = draft.mapsLink.trim();
    if (!text) {
      setLoc(null);
      setLocStatus("");
      return;
    }
    if (isShortGoogleMapsLink(text)) setLocStatus("checking");
    const found = await resolveGoogleMapsLocation(text);
    setLoc(found);
    setLocStatus(found ? "found" : looksLikeGoogleMapsLink(text) ? "not-found" : "");
  };

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(await compressImage(file));
  };

  const canSave = draft.name.trim() && (loc || draft.mapsLink.trim()) && !saving;

  const save = async () => {
    setSaving(true);
    try {
      const photoUrl = photoFile ? await uploadSpotPhoto(photoFile) : null;
      const res = await fetch("/api/admin/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          area: draft.area.trim(),
          about: draft.about.trim(),
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
          maps_link: draft.mapsLink.trim(),
          photo_url: photoUrl,
          is_popular: draft.isPopular,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to add spot");
      setDraft(emptyDraft);
      setLoc(null);
      setLocStatus("");
      setPhotoFile(null);
      onCreated(data.spot);
    } catch (err) {
      showToast(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: 18, marginBottom: 20 }}>
      <div style={{ font: "600 16px var(--font-display)", color: "var(--ink)" }}>Add a spot directly</div>

      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Name" value={draft.name} onChange={(v) => set({ name: v })} flex={2} />
        <Field label="Area" value={draft.area} onChange={(v) => set({ area: v })} flex={1} />
      </div>

      <TextField label="About (optional)" value={draft.about} onChange={(e) => set({ about: e.target.value })} multiline />

      <div>
        <TextField
          label="Google Maps link"
          value={draft.mapsLink}
          onChange={(e) => {
            set({ mapsLink: e.target.value });
            setLoc(null);
            setLocStatus("");
          }}
          onBlur={resolveLocation}
          placeholder="Paste a share link, e.g. https://maps.app.goo.gl/…"
        />
        <div style={{ font: "400 12px var(--font-body)", marginTop: 6, color: locStatus === "found" ? "var(--green)" : locStatus === "not-found" ? "var(--pin-active)" : "var(--muted)" }}>
          {locStatus === "checking" ? "Reading link…" : null}
          {locStatus === "found" && loc ? `Location found: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : null}
          {locStatus === "not-found" ? "Couldn't read coordinates from that link — it'll still be saved as an external \"View location\" link." : null}
          {!locStatus ? "Paste a link from Maps' Share button; it's read automatically when you tab away." : null}
        </div>
      </div>

      <div>
        <div style={{ font: "700 13px/1.3 var(--font-body)", letterSpacing: "0.02em", color: "var(--ink-soft)", marginBottom: 9 }}>Photo (optional)</div>
        <input type="file" accept="image/*" onChange={onPhotoChange} style={{ font: "400 13px var(--font-body)" }} />
      </div>

      <div>
        <Chip selected={draft.isPopular} icon={<span>★</span>} onClick={() => set({ isPopular: !draft.isPopular })}>
          Popular
        </Chip>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <ActionButton onClick={save} disabled={!canSave} tone="approve">{saving ? "Adding…" : "Add spot"}</ActionButton>
        <ActionButton onClick={onCancel} disabled={saving}>Cancel</ActionButton>
      </div>
    </div>
  );
}

const IMPORT_HEADERS = ["Name", "Area", "About", "Maps Link", "Photo Filename", "Popular"];
const IMPORT_TEMPLATE_ROW = {
  Name: "Kapaleeshwarar Street Idol",
  Area: "Mylapore",
  About: "A 14-foot idol set inside a gopuram-shaped structure.",
  "Maps Link": "https://maps.app.goo.gl/example",
  "Photo Filename": "kapaleeshwarar.jpg",
  Popular: "yes",
};

// CSV headers are matched case-insensitively, with a couple of aliases per
// column so a sheet exported from wherever the admin already tracks
// spots doesn't have to be renamed to match our exact template first.
function pick(row, ...keys) {
  for (const key of keys) {
    const value = row[key];
    if (value) return value;
  }
  return "";
}

function downloadCsvTemplate() {
  const csv = toCsv([IMPORT_TEMPLATE_ROW], IMPORT_HEADERS);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "spots-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Bulk version of AddSpotForm — every row is created already approved, the
// same as a single admin-added spot. Runs strictly one row at a time
// (rather than in parallel) so a short-link resolution doesn't fire a
// burst of simultaneous outbound requests, and so progress can be shown
// as it goes rather than all-or-nothing at the end.
function BulkImportForm({ onImported, onCancel }) {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [photoFiles, setPhotoFiles] = useState(new Map()); // lowercased filename -> File
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const showToast = useToast();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    setProgress(0);
    const text = await file.text();
    setRows(parseCsv(text));
  };

  const onPhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles(new Map(files.map((f) => [f.name.toLowerCase(), f])));
  };

  const runImport = async () => {
    if (!rows || rows.length === 0) return;
    setImporting(true);
    const outcomes = [];
    for (const row of rows) {
      const name = pick(row, "name").trim();
      if (!name) {
        outcomes.push({ name: "(blank row)", ok: false, message: "Missing name — skipped" });
        setProgress(outcomes.length);
        continue;
      }
      const mapsLink = pick(row, "maps link", "google maps link", "link", "maps").trim();
      const loc = await resolveGoogleMapsLocation(mapsLink);
      if (!loc && !mapsLink) {
        outcomes.push({ name, ok: false, message: "No location — skipped" });
        setProgress(outcomes.length);
        continue;
      }

      // Best-effort: a filename that doesn't match any selected photo just
      // means the spot is created without one, not a failed row — the
      // photo is a nice-to-have, the location is not.
      let photoUrl = null;
      let photoNote = "";
      const photoFilename = pick(row, "photo filename", "photo", "image", "image filename").trim();
      if (photoFilename) {
        const match = photoFiles.get(photoFilename.toLowerCase());
        if (match) {
          try {
            photoUrl = await uploadSpotPhoto(await compressImage(match));
          } catch {
            photoNote = " (photo upload failed)";
          }
        } else {
          photoNote = ` (photo "${photoFilename}" not found among selected files)`;
        }
      }

      try {
        const res = await fetch("/api/admin/spots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            area: pick(row, "area"),
            about: pick(row, "about", "description"),
            lat: loc?.lat ?? null,
            lng: loc?.lng ?? null,
            maps_link: mapsLink,
            photo_url: photoUrl,
            is_popular: /^(y|yes|true|1)$/i.test(pick(row, "popular").trim()),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed");
        outcomes.push({
          name,
          ok: true,
          message: (loc ? "Added" : "Added (no map pin — link had no coordinates)") + photoNote,
          spot: data.spot,
        });
      } catch (err) {
        outcomes.push({ name, ok: false, message: err.message || "Failed" });
      }
      setProgress(outcomes.length);
    }
    setResults(outcomes);
    setImporting(false);
    const createdSpots = outcomes.filter((o) => o.ok && o.spot).map((o) => o.spot);
    if (createdSpots.length > 0) {
      showToast(`Added ${createdSpots.length} of ${rows.length} spots`);
      onImported(createdSpots);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: 18, marginBottom: 20 }}>
      <div style={{ font: "600 16px var(--font-display)", color: "var(--ink)" }}>Bulk import from CSV</div>
      <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--muted)" }}>
        Columns: Name (required), Area, About, Maps Link, Photo Filename, Popular.{" "}
        <button onClick={downloadCsvTemplate} style={{ font: "600 13px var(--font-body)", color: "var(--accent)", textDecoration: "underline" }}>
          Download a template
        </button>
      </div>

      <div>
        <div style={{ font: "700 13px/1.3 var(--font-body)", letterSpacing: "0.02em", color: "var(--ink-soft)", marginBottom: 6 }}>CSV file</div>
        <input type="file" accept=".csv,text/csv" onChange={onFileChange} style={{ font: "400 13px var(--font-body)" }} />
        {rows ? (
          <div style={{ font: "400 13px var(--font-body)", color: "var(--ink-soft)", marginTop: 6 }}>
            {fileName}: {rows.length} row{rows.length === 1 ? "" : "s"} found.
          </div>
        ) : null}
      </div>

      <div>
        <div style={{ font: "700 13px/1.3 var(--font-body)", letterSpacing: "0.02em", color: "var(--ink-soft)", marginBottom: 6 }}>
          Photos <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional — select all at once, matched to rows by the Photo Filename column)</span>
        </div>
        <input type="file" accept="image/*" multiple onChange={onPhotosChange} style={{ font: "400 13px var(--font-body)" }} />
        {photoFiles.size > 0 ? (
          <div style={{ font: "400 13px var(--font-body)", color: "var(--ink-soft)", marginTop: 6 }}>{photoFiles.size} photo{photoFiles.size === 1 ? "" : "s"} selected.</div>
        ) : null}
      </div>

      {results ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 10 }}>
          {results.map((r, i) => (
            <div key={i} style={{ font: "400 12.5px var(--font-body)", color: r.ok ? "var(--green)" : "var(--pin-active)" }}>
              {r.ok ? "✓" : "✕"} {r.name} — {r.message}
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
        <ActionButton onClick={runImport} disabled={!rows || rows.length === 0 || importing} tone="approve">
          {importing ? `Importing… ${progress}/${rows?.length ?? 0}` : "Import spots"}
        </ActionButton>
        <ActionButton onClick={onCancel} disabled={importing}>Close</ActionButton>
      </div>
    </div>
  );
}

function SpotReviewCard({ spot, onChange, onSave, onAction, onDelete }) {
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 18, background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: 18, opacity: busy ? 0.6 : 1 }}>
      <div style={{ flex: "none", width: 140 }}>
        {spot.photo_url ? (
          <img src={spot.photo_url} alt="" style={{ width: 140, height: 140, borderRadius: "var(--radius-md)", objectFit: "cover", background: "var(--paper)" }} />
        ) : (
          <div style={{ width: 140, height: 140, borderRadius: "var(--radius-md)", background: "var(--paper)", display: "grid", placeItems: "center", font: "400 12px var(--font-body)", color: "var(--muted)" }}>
            No photo
          </div>
        )}
        <a href={googleMapsUrl(spot)} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 8, font: "400 12px var(--font-body)", textAlign: "center" }}>
          View location ↗
        </a>
        <div style={{ font: "400 11px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
          {spot.submitted_by || "Anon"}
          <br />
          {new Date(spot.created_at).toLocaleString()}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Name" value={spot.name} onChange={(v) => onChange({ name: v })} flex={2} />
          <Field label="Area" value={spot.area} onChange={(v) => onChange({ area: v })} flex={1} />
        </div>
        <Field label="Maps link" value={spot.maps_link || ""} onChange={(v) => onChange({ maps_link: v })} />
        <TextField label="About" value={spot.about || ""} onChange={(e) => onChange({ about: e.target.value })} multiline />

        <div>
          <Chip selected={!!spot.is_popular} icon={<span>★</span>} onClick={() => onChange({ is_popular: !spot.is_popular })}>
            Popular
          </Chip>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <ActionButton onClick={() => run(onSave)} disabled={busy}>Save changes</ActionButton>
          {spot.status !== "approved" ? (
            <ActionButton onClick={() => run(() => onAction("approve"))} disabled={busy} tone="approve">Approve</ActionButton>
          ) : null}
          {spot.status !== "rejected" ? (
            <ActionButton onClick={() => run(() => onAction("reject"))} disabled={busy} tone="reject">Reject</ActionButton>
          ) : null}
          {spot.status !== "pending" ? (
            <ActionButton onClick={() => run(() => onAction("pending"))} disabled={busy}>Move to pending</ActionButton>
          ) : null}
          <ActionButton onClick={() => run(onDelete)} disabled={busy} tone="reject" ghost>Delete</ActionButton>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, flex }) {
  return (
    <div style={{ flex }}>
      <TextField label={label} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ActionButton({ children, onClick, disabled, tone, ghost }) {
  const colors = {
    approve: { background: "var(--green)", color: "#ffffff" },
    reject: ghost ? { background: "transparent", color: "var(--pin-active)", border: "1px solid var(--line-strong)" } : { background: "var(--pin)", color: "#ffffff" },
  };
  const style = tone
    ? colors[tone]
    : { background: "var(--paper)", color: "var(--ink)" };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ height: 36, padding: "0 14px", borderRadius: 9999, font: "700 15px var(--font-display)", ...style }}
    >
      {children}
    </button>
  );
}
