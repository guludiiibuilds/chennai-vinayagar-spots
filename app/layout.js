import { Baloo_2, Mulish } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

// Baloo 2 (rounded, celebratory) carries headings/buttons/badges; Mulish
// carries body/forms/metadata — the Chennai Vinayagar DS type pairing.
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata = {
  title: "Chennai Vinayagar Spots",
  description:
    "Find and share Vinayagar Chaturthi idols across Chennai — no login needed to browse or submit.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fefcf7",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${baloo.variable} ${mulish.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
