import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "Chennai Vinayagar Spots",
  description:
    "Find and share Vinayagar Chaturthi pandals across Chennai — no login needed to browse or submit.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C77E0A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrumentSerif.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
