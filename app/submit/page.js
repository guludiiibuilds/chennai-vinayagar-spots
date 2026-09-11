"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApprovedSpots, uploadSpotPhoto, submitSpot } from "@/lib/spots";
import { DUPLICATE_RADIUS_KM, extractLatLngFromMapsLink, findNearestSpot, reverseGeocodeArea } from "@/lib/geo";
import { compressImage } from "@/lib/image";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { useToast } from "@/components/ToastProvider";
import { BackIcon, CompassIcon, CheckIcon } from "@/components/icons";
import DesktopNotice from "@/components/DesktopNotice";
import LocationConfirmSheet from "@/components/LocationConfirmSheet";
import DuplicateSpotSheet from "@/components/DuplicateSpotSheet";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { TextField } from "@/components/TextField";

export default function SubmitPage() {
  return (
    <Suspense fallback={null}>
      <SubmitForm />
    </Suspense>
  );
}

function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const fileInputRef = useRef(null);

  const isDesktop = useIsDesktop(1024);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [name, setName] = useState("");
  // Pre-filled when arriving from the "Confirm Location" step
  // (/submit/location) via ?lat=&lng=&area= — still fully editable here.
  const [loc, setLoc] = useState(() => {
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [mapsLink, setMapsLink] = useState("");
  const [area, setArea] = useState(() => searchParams.get("area") || "");
  const arrivedWithArea = useRef(!!searchParams.get("area"));
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // submitted spot name
  const [existingSpots, setExistingSpots] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { spot, onContinue }
  // A location arriving pre-filled from /submit/location has already been
  // vetted there (LocationConfirmSheet runs this same check before
  // confirming), so it doesn't need asking about again here.
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(() => {
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    return Number.isFinite(lat) && Number.isFinite(lng);
  });

  const canSubmit = !!(photoFile && name.trim() && (loc || mapsLink.trim())) && !submitting;

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

  const pickPhoto = () => fileInputRef.current?.click();

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show the original instantly so picking a photo never feels like it
    // stalled, then swap in the compressed version once it's ready.
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setCompressingPhoto(true);
    const compressed = await compressImage(file);
    setCompressingPhoto(false);
    setPhotoFile(compressed);
    if (compressed !== file) {
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(compressed);
      });
    }
  };

  // Prefill Area from the captured GPS point so submitters (and the admin
  // reviewer) don't have to type the neighbourhood by hand — never
  // overwrites something the person already typed themselves.
  useEffect(() => {
    if (!loc || arrivedWithArea.current) return;
    let cancelled = false;
    reverseGeocodeArea(loc.lat, loc.lng).then((name) => {
      if (cancelled || !name) return;
      setArea((prev) => (prev.trim() ? prev : name));
    });
    return () => {
      cancelled = true;
    };
  }, [loc]);

  // Runs the same nearby-spot check the map picker runs at confirm-time,
  // but for the pasted-link path — as soon as the link is parseable,
  // rather than waiting until final submit.
  const lookupAreaFromMapsLink = async () => {
    const derived = extractLatLngFromMapsLink(mapsLink.trim());
    if (derived && !duplicateConfirmed) {
      const nearest = findNearestSpot(derived, existingSpots);
      if (nearest && nearest.distKm <= DUPLICATE_RADIUS_KM) {
        setDuplicateWarning({
          spot: nearest,
          onContinue: () => {
            setDuplicateConfirmed(true);
            setDuplicateWarning(null);
          },
        });
      }
    }
    if (area.trim() || loc || !derived) return;
    const foundName = await reverseGeocodeArea(derived.lat, derived.lng);
    if (foundName) setArea((prev) => (prev.trim() ? prev : foundName));
  };

  // LocationConfirmSheet already ran this same check before calling
  // onConfirm, so a location arriving here has already been vetted (either
  // clear, or explicitly confirmed as a different idol).
  const confirmLocation = (center, newArea) => {
    setLoc(center);
    if (newArea) setArea(newArea);
    setShowLocationSheet(false);
    setDuplicateWarning(null);
    setDuplicateConfirmed(true);
  };

  const deriveLocation = () => loc || extractLatLngFromMapsLink(mapsLink.trim());

  const performSubmit = async () => {
    setSubmitting(true);
    try {
      const photoUrl = photoFile ? await uploadSpotPhoto(photoFile) : null;
      const link = mapsLink.trim();
      const derived = deriveLocation();
      const spot = await submitSpot({
        name: name.trim(),
        area: area.trim(),
        about: about.trim(),
        lat: derived?.lat ?? null,
        lng: derived?.lng ?? null,
        mapsLink: link || null,
        photoUrl,
      });
      setDone(spot.name);
    } catch (err) {
      showToast(err.message || "Something went wrong — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  // Safety net for whichever earlier check never actually ran (e.g. a
  // pasted link submitted without the field ever losing focus) — everything
  // else has already been vetted by the time this fires.
  const submit = () => {
    if (!canSubmit) {
      showToast("Please add a photo, a name and a location");
      return;
    }
    if (!duplicateConfirmed) {
      const nearest = findNearestSpot(deriveLocation(), existingSpots);
      if (nearest && nearest.distKm <= DUPLICATE_RADIUS_KM) {
        setDuplicateWarning({
          spot: nearest,
          onContinue: () => {
            setDuplicateConfirmed(true);
            setDuplicateWarning(null);
            performSubmit();
          },
        });
        return;
      }
    }
    performSubmit();
  };

  if (isDesktop) {
    return <DesktopNotice onBack={() => router.push("/")} />;
  }

  if (done) {
    return (
      <div className="app-shell">
        <div className="app-frame" style={successFrameStyle}>
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: "50%",
              background: "var(--green)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CheckIcon stroke="#ffffff" width={34} height={34} strokeWidth={2.6} />
          </div>
          <h2 style={{ font: "600 28px/1.2 var(--font-display)", letterSpacing: "-.374px", color: "var(--ink)", margin: "22px 0 0" }}>
            Sent for review
          </h2>
          <p style={{ font: "400 15px/1.6 var(--font-body)", color: "var(--ink-soft)", margin: "12px 0 0", maxWidth: 270 }}>
            Thank you for adding <strong style={{ color: "var(--ink)" }}>{done}</strong>. A volunteer will approve it shortly and it will show up on
            the map for everyone.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 28, width: "100%", maxWidth: 280 }}>
            <Button variant="primary" onClick={() => router.push("/")} style={{ height: 50 }}>
              Go to Map View
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ animation: "fadeUp .28s ease both" }}>
        {showLocationSheet ? (
          <LocationConfirmSheet
            initialCenter={loc}
            initialArea={area}
            title={loc ? "Change Location" : "Confirm Location"}
            confirmLabel={loc ? "Update Location" : "Confirm Location"}
            onConfirm={confirmLocation}
            onClose={() => setShowLocationSheet(false)}
          />
        ) : null}

        <DuplicateSpotSheet
          spot={duplicateWarning?.spot}
          onCancel={() => setDuplicateWarning(null)}
          onContinue={duplicateWarning?.onContinue}
        />

        <div style={{ flex: "none", padding: "16px 18px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <IconButton variant="outline" onClick={() => router.push("/")} label="Cancel" icon={<BackIcon />} />
          <div>
            <div style={{ font: "600 17px/1.2 var(--font-display)", letterSpacing: "-.374px", color: "var(--ink)" }}>Spot a Vinayaka</div>
            <div style={{ font: "400 11.5px/1.3 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>Fill correct data for others to view.</div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 18px 8px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <FieldLabel>Vinayaka Photo</FieldLabel>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
            <button
              onClick={pickPhoto}
              style={{
                width: "100%",
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${photoFile ? "var(--green)" : "var(--line-strong)"}`,
                background: photoFile ? "var(--green-tint)" : "var(--card)",
                padding: photoFile ? 14 : "26px 16px",
                display: "grid",
                placeItems: "center",
              }}
            >
              {photoFile ? (
                <div style={{ display: "flex", alignItems: "center", gap: 11, width: "100%" }}>
                  <img src={photoPreview} alt="" style={{ width: 52, height: 52, borderRadius: "var(--radius-sm)", objectFit: "cover" }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ font: "600 13px var(--font-body)", color: "var(--ink)" }}>{photoFile.name}</div>
                    <div style={{ font: "400 11.5px var(--font-body)", color: compressingPhoto ? "var(--muted)" : "var(--green)", marginTop: 3 }}>
                      {compressingPhoto ? "Optimizing…" : "Attached · tap to change"}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.9" strokeLinecap="round">
                    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-2h6.4l1.1 2h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Z"></path>
                    <circle cx="12" cy="12.5" r="3.4"></circle>
                  </svg>
                  <div style={{ font: "600 13.5px var(--font-body)", color: "var(--ink)", marginTop: 8 }}>Take or upload a photo</div>
                  <div style={{ font: "400 11.5px var(--font-body)", color: "var(--muted)", marginTop: 3 }}>One clear shot of the idol</div>
                </div>
              )}
            </button>
          </div>

          <TextField
            label="Vinayaka Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kapaleeshwarar Street Idol"
          />

          <div>
            <FieldLabel>Location</FieldLabel>
            <button
              onClick={() => setShowLocationSheet(true)}
              style={{
                width: "100%",
                textAlign: "left",
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${loc ? "var(--green)" : "var(--line-strong)"}`,
                background: loc ? "var(--green-tint)" : "var(--card)",
                padding: "12px 13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ flex: "none", width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--accent-tint)", display: "grid", placeItems: "center" }}>
                  <CompassIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 13.5px var(--font-body)", color: "var(--ink)" }}>{loc ? "Location set" : "Set location on map"}</div>
                  <div style={{ font: "400 11.5px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 3 }}>
                    {loc ? `${loc.lat.toFixed(4)}° N, ${loc.lng.toFixed(4)}° E · tap to change` : "Drop a pin on the map to set it"}
                  </div>
                </div>
                {loc ? <CheckIcon width={18} height={18} strokeWidth={3} /> : null}
              </div>
            </button>
            <div style={{ font: "400 11.5px/1.5 var(--font-body)", color: "var(--muted)", marginTop: 8, padding: "0 2px" }}>
              Or paste a Google Maps link instead
            </div>
            {/* Plain input, not TextField: needs an onBlur handler (to look
                up the area from the pasted link) that TextField's fixed
                props don't expose. */}
            <input
              className="field-input"
              value={mapsLink}
              onChange={(e) => {
                setMapsLink(e.target.value);
                setDuplicateWarning(null);
                setDuplicateConfirmed(false);
              }}
              onBlur={lookupAreaFromMapsLink}
              placeholder="https://maps.app.goo.gl/…"
              style={{
                width: "100%",
                height: 46,
                marginTop: 7,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line)",
                background: "var(--card)",
                padding: "0 13px",
                font: "400 16px var(--font-body)",
                color: "var(--ink)",
                outline: 0,
              }}
            />
          </div>

          <TextField
            label={
              <>
                Area / Neighbourhood <span style={{ color: "var(--muted)", fontWeight: 400 }}>(auto-filled from location)</span>
              </>
            }
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Mylapore"
          />

          <TextField
            label={
              <>
                Describe Vinayaka <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
              </>
            }
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Idol height, timings, anything visitors should know"
            multiline
          />
        </div>

        <div style={{ flex: "none", padding: "12px 14px 16px", background: "var(--card)", borderTop: "1px solid var(--border-subtle)" }}>
          <Button variant="primary" onClick={submit} disabled={!canSubmit} loading={submitting} style={{ width: "100%", height: 50 }}>
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ font: "700 13px/1.3 var(--font-body)", letterSpacing: "0.02em", color: "var(--ink-soft)", marginBottom: 9 }}>
      {children}
    </div>
  );
}

const successFrameStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 34,
  textAlign: "center",
  background: "var(--card)",
  animation: "fadeUp .3s ease both",
};
