import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXIF Framer",
  description:
    "Add a polaroid-style EXIF frame to your photos. Processed entirely in your browser.",
  applicationName: "EXIF Framer",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EXIF Framer",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full font-sans antialiased">
        <I18nProvider>{children}</I18nProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
