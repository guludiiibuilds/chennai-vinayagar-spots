"use client";

import { useEffect, useState } from "react";

// Used to gate desktop-only behavior (e.g. blocking the mobile-only submit
// flow) — separate from any layout breakpoint, since "desktop" here means
// "wide enough that camera/GPS capture isn't realistic," not a CSS layout
// switch.
export function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isDesktop;
}
