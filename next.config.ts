import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone / LAN access during `npm run dev` (not just localhost).
  // Update the IP if your Mac's address changes.
  allowedDevOrigins: ["192.168.2.230", "127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
