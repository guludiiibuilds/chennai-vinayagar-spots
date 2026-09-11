"use client";

import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/lib/useIsDesktop";
import DesktopNotice from "@/components/DesktopNotice";
import LocationConfirmSheet from "@/components/LocationConfirmSheet";

export default function ConfirmLocationPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop(1024);

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
        <LocationConfirmSheet onConfirm={confirm} onClose={() => router.push("/")} onSkip={() => router.push("/submit")} />
      </div>
    </div>
  );
}
