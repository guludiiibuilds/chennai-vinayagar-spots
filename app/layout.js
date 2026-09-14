import { Baloo_2, Mulish } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

// Baloo 2 (rounded, celebratory) carries headings/buttons/badges; Mulish
// carries body/forms/metadata — the Chennai Ganesha DS type pairing.
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

const siteUrl = "https://chennaivinayagar.vercel.app";
const title = "Ganesh Chaturthi Idols 2026";
const description =
  "Find and share Ganesha Chaturthi idols across India — no login needed to browse or submit.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  // Open Graph + Twitter Card: what actually renders as the rich preview
  // when this link is pasted into WhatsApp, Twitter/X, Facebook, etc. —
  // without these, sharing the link showed an inconsistent (or blank)
  // platform-default preview instead of this app's own title/description.
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
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
