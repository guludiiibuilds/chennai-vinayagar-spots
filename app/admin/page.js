"use client";

import { useEffect, useState } from "react";
import { googleMapsUrl } from "@/lib/geo";
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

// Pure fetch helper with no setState of its own, so it can be safely
// awaited both from an Effect (whose own setState calls must stay inside
// the returned promise's .then/.catch, not synchronous in the Effect body)
// and from event handlers (login) where synchronous setState is fine.
async function fetchSpotsByStatus(status) {
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

export default function AdminPage() {
  const [authed, setAuthed] = useState(null); // null = checking
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState("pending");
  const [prevTab, setPrevTab] = useState(tab);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
        landmark: spot.landmark,
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
          <div style={{ display: "flex", gap: 6 }}>
            {TABS.map((t) => (
              <Chip key={t.key} selected={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </Chip>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={logout} style={{ height: 36 }}>
            Log out
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "22px 20px 60px" }}>
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
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Landmark" value={spot.landmark} onChange={(v) => onChange({ landmark: v })} flex={1} />
          <Field label="Maps link" value={spot.maps_link || ""} onChange={(v) => onChange({ maps_link: v })} flex={1} />
        </div>
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
