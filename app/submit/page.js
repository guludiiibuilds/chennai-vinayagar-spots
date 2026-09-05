"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadSpotPhoto, submitSpot } from "@/lib/spots";
import { extractLatLngFromMapsLink } from "@/lib/geo";
import { useToast } from "@/components/ToastProvider";
import { BackIcon, CompassIcon, CheckIcon } from "@/components/icons";

export default function SubmitPage() {
  const router = useRouter();
  const showToast = useToast();
  const fileInputRef = useRef(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [name, setName] = useState("");
  const [loc, setLoc] = useState(null); // { lat, lng }
  const [locating, setLocating] = useState(false);
  const [mapsLink, setMapsLink] = useState("");
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // submitted spot name

  // Photo is optional for now — TODO: once photos are required again, the
  // Supabase storage upload path needs to compress/resize images before
  // upload instead of storing the original file as-is (uploadSpotPhoto in
  // lib/spots.js). Flagged per user request on 2026-09-05.
  const canSubmit = !!(name.trim() && (loc || mapsLink.trim())) && !submitting;

  const pickPhoto = () => fileInputRef.current?.click();

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      showToast("Location isn't available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        showToast("Couldn't get your location — try pasting a Maps link instead");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    if (!canSubmit) {
      showToast("Please add a name and a location");
      return;
    }
    setSubmitting(true);
    try {
      const photoUrl = photoFile ? await uploadSpotPhoto(photoFile) : null;
      const link = mapsLink.trim();
      const derived = loc || extractLatLngFromMapsLink(link);
      const spot = await submitSpot({
        name: name.trim(),
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
            <button
              onClick={() => router.push("/")}
              style={{
                height: 50,
                borderRadius: 9999,
                background: "var(--accent)",
                color: "#ffffff",
                font: "400 17px var(--font-body)",
              }}
            >
              Go to Map View
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ animation: "fadeUp .28s ease both" }}>
        <div style={{ flex: "none", padding: "16px 18px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/")}
            aria-label="Cancel"
            style={{ width: 36, height: 36, borderRadius: 9999, background: "var(--paper)", display: "grid", placeItems: "center" }}
          >
            <BackIcon />
          </button>
          <div>
            <div style={{ font: "600 17px/1.2 var(--font-body)", letterSpacing: "-.374px", color: "var(--ink)" }}>Spot a Vinayagar</div>
            <div style={{ font: "400 11.5px/1.3 var(--font-body)", color: "var(--muted)", marginTop: 2 }}>Three things. No login needed.</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 110px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ padding: "13px 14px", borderRadius: "var(--radius-md)", background: "var(--accent-tint)", font: "400 12px/1.6 var(--font-body)", color: "var(--ink-soft)" }}>
            Please be mindful when you are uploading details as this would help others to view Vinayagar pandals.
          </div>

          <div>
            <FieldLabel>
              1 · Photo <span style={{ textTransform: "none", color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
            </FieldLabel>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onPhotoChange} style={{ display: "none" }} />
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
                    <div style={{ font: "400 11.5px var(--font-body)", color: "var(--green)", marginTop: 3 }}>Attached · tap to change</div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a7a7a" strokeWidth="1.9" strokeLinecap="round">
                    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-2h6.4l1.1 2h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Z"></path>
                    <circle cx="12" cy="12.5" r="3.4"></circle>
                  </svg>
                  <div style={{ font: "600 13.5px var(--font-body)", color: "var(--ink)", marginTop: 8 }}>Take or upload a photo</div>
                  <div style={{ font: "400 11.5px var(--font-body)", color: "var(--muted)", marginTop: 3 }}>One clear shot of the idol or pandal</div>
                </div>
              )}
            </button>
          </div>

          <div>
            <FieldLabel>2 · Name of the pandal</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kapaleeshwarar Street Pandal"
              style={{
                width: "100%",
                height: 50,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line-strong)",
                background: "var(--card)",
                padding: "0 14px",
                font: "400 16px var(--font-body)",
                color: "var(--ink)",
                outline: 0,
              }}
            />
          </div>

          <div>
            <FieldLabel>3 · Where is it?</FieldLabel>
            <button
              onClick={useGps}
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
                  <div style={{ font: "600 13.5px var(--font-body)", color: "var(--ink)" }}>
                    {locating ? "Locating…" : loc ? "Location captured" : "Use my current location"}
                  </div>
                  <div style={{ font: "400 11.5px/1.4 var(--font-body)", color: "var(--muted)", marginTop: 3 }}>
                    {loc ? `${loc.lat.toFixed(4)}° N, ${loc.lng.toFixed(4)}° E` : "Pin drops where you're standing — adjust after"}
                  </div>
                </div>
                {loc ? <CheckIcon width={18} height={18} strokeWidth={3} /> : null}
              </div>
            </button>
            <div style={{ font: "400 11.5px/1.5 var(--font-body)", color: "var(--muted)", marginTop: 8, padding: "0 2px" }}>
              Or paste a Google Maps link instead
            </div>
            <input
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
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

          <div>
            <FieldLabel>
              4 · Describe the pandal <span style={{ textTransform: "none", color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
            </FieldLabel>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Theme, idol height, timings, anything visitors should know"
              rows={4}
              style={{
                width: "100%",
                minHeight: 90,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line-strong)",
                background: "var(--card)",
                padding: "12px 14px",
                font: "400 16px/1.5 var(--font-body)",
                color: "var(--ink)",
                outline: 0,
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 14px 16px", background: "linear-gradient(180deg,rgba(255,255,255,0),var(--card) 34%)" }}>
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 9999,
              display: "grid",
              placeItems: "center",
              font: "400 17px var(--font-body)",
              ...(canSubmit ? { background: "var(--accent)", color: "#ffffff" } : { background: "var(--paper)", color: "var(--muted)", cursor: "not-allowed" }),
            }}
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ font: "600 11px/1 var(--font-body)", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 9 }}>
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
