// Shared "Share" button behavior for SpotSheet and SpotPanel. Tries to
// attach the spot's photo as a share file (so apps like WhatsApp show the
// image, not just a link preview) and always falls back gracefully —
// no photo, a fetch failure, or a browser that can't share files all just
// drop straight back to a plain text+link share, then to a clipboard copy
// on browsers with no Web Share API at all (e.g. desktop).
export async function shareSpot(spot) {
  if (typeof window === "undefined" || !spot) return;

  const url = `${window.location.origin}/?spot=${spot.id}`;
  const text = `Check out ${spot.name} on Chennai Vinayagar Spots 🐘`;
  const base = { title: spot.name, text, url };

  let file = null;
  if (spot.photo_url && navigator.canShare) {
    try {
      const res = await fetch(spot.photo_url);
      const blob = await res.blob();
      const ext = blob.type.split("/")[1] || "jpg";
      const candidate = new File([blob], `${spot.name}.${ext}`, { type: blob.type });
      if (navigator.canShare({ files: [candidate] })) file = candidate;
    } catch {
      // Photo couldn't be fetched/converted — share without it.
    }
  }

  if (navigator.share) {
    try {
      await navigator.share(file ? { ...base, files: [file] } : base);
    } catch (err) {
      // A share with an attached file can be rejected by the target app even
      // when canShare() approved it — retry as plain text+link before giving
      // up. A user-cancelled share (AbortError) isn't a failure to recover from.
      if (file && err?.name !== "AbortError") {
        navigator.share(base).catch(() => {});
      }
    }
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
  }
}
