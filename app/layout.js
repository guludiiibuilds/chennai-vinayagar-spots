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

// A first-time visitor's browser doesn't start talking to these origins
// until the JS that requests them (the map, Supabase, area lookups —
// mostly loaded via dynamic import, see app/page.js) has downloaded and
// run. Preconnecting lets it start the DNS/TLS handshake in parallel with
// that download instead, which is most of what a genuinely slow first
// load on a new device actually is.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${baloo.variable} ${mulish.variable}`}>
      <head>
        {/* Leaflet's default tile subdomain rotation for the CARTO basemap. */}
        <link rel="preconnect" href="https://a.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://b.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://c.basemaps.cartocdn.com" />
        {supabaseUrl ? <link rel="preconnect" href={supabaseUrl} /> : null}
        <link rel="preconnect" href="https://nominatim.openstreetmap.org" />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
