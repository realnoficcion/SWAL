import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SWAL // NY surf ops",
  description:
    "Waleska's private surf console. Live NOAA swell, wind & tide for New York breaks.",
  applicationName: "SWAL",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SWAL",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
