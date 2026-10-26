import type { NextConfig } from "next";

const backendInternalUrl = (
  process.env.BACKEND_INTERNAL_URL || "http://backend:8000"
).replace(/\/$/, "");

// Origin backend yang dilihat browser (sama dengan APP_URL di backend).
const backendOrigin = new URL(
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8000"
);

const nextConfig: NextConfig = {
  images: {
    // Avatar/foto dari storage backend; hanya path /storage yang diizinkan.
    remotePatterns: [
      {
        protocol: backendOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: backendOrigin.hostname,
        port: backendOrigin.port,
        pathname: "/storage/**",
      },
    ],
    // Origin backend dipetakan ke path same-origin /storage (lihat lib/images.ts).
    localPatterns: [{ pathname: "/storage/**" }],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendInternalUrl}/api/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${backendInternalUrl}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
