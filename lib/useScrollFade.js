"use client";

import { useEffect, useRef, useState } from "react";

// Tracks whether a scrollable element still has content below the fold, so
// a caller can show a "there's more below" fade instead of letting a long
// scroll go silently undiscoverable (a user has no way to tell a sheet is
// scrollable at all otherwise — overflow:auto gives no visual cue on its
// own). Re-checks on scroll/resize and whenever `dep` changes, since a new
// spot's description swaps the scrollable content in without remounting
// the element.
export function useScrollFade(dep) {
  const ref = useRef(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setShowFade(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [dep]);

  return { ref, showFade };
}
