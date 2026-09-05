import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

// Real SF Pro renders on Apple devices via the -apple-system/BlinkMacSystemFont
// stack in globals.css; Inter is loaded as the closest open-source match for
// everyone else, per the design system's own font-substitution guidance.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
