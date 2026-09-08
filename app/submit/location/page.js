"use client";

import { useRouter } from "next/navigation";
import LocationConfirmSheet from "@/components/LocationConfirmSheet";

export default function ConfirmLocationPage() {
  const router = useRouter();

  const confirm = (center, area) => {
    if (!center) return;
    const params = new URLSearchParams({ lat: String(center.lat), lng: String(center.lng) });
    if (area) params.set("area", area);
    router.push(`/submit?${params.toString()}`);
  };

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ animation: "fadeUp .28s ease both" }}>
        <LocationConfirmSheet onConfirm={confirm} onClose={() => router.push("/")} onSkip={() => router.push("/submit")} />
      </div>
    </div>
  );
}
