"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsDesktop } from "@/lib/useIsDesktop";
import DesktopNotice from "@/components/DesktopNotice";
import LocationConfirmSheet from "@/components/LocationConfirmSheet";

export default function ConfirmLocationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmLocation />
    </Suspense>
  );
}

function ConfirmLocation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop(1024);

  // Home already has a position by the time it links here (see
  // goToSubmitLocation in app/page.js) — reusing it as the starting point
  // means this screen doesn't request a brand new GPS fix from scratch,
  // which is what was showing up as a multi-second delay on open.
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));
  const initialCenter = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  const confirm = (center, area) => {
    if (!center) return;
    const params = new URLSearchParams({ lat: String(center.lat), lng: String(center.lng) });
    if (area) params.set("area", area);
    router.push(`/submit?${params.toString()}`);
  };

  if (isDesktop) {
    return <DesktopNotice onBack={() => router.push("/")} />;
  }

  return (
    <div className="app-shell app-shell--full">
      <div className="app-frame app-frame--full" style={{ animation: "fadeUp .28s ease both" }}>
        <LocationConfirmSheet initialCenter={initialCenter} onConfirm={confirm} onClose={() => router.push("/")} />
      </div>
    </div>
  );
}
