import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Escape hatch for local builds: on Windows, antivirus and folder sync hold
  // handles inside .next and the build fails renaming files. Point the build
  // somewhere unsynced with NEXT_DIST_DIR. Unset everywhere else.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),

  images: {
    // Every photograph is served by /api/media/[id] from this app's own
    // database. No remote hosts are whitelisted; adding one is a deliberate act.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 828, 1080, 1200, 1920],
  },

  // `postgres` opens raw TCP sockets; it must never be bundled for the browser.
  serverExternalPackages: ["postgres"],

  experimental: {
    serverActions: {
      // Server Actions default to a 1 MB body, which 413s a phone photo before
      // uploadMedia's own 15 MB check can run and explain itself.
      bodySizeLimit: "16mb",
    },
  },

  poweredByHeader: false,

  // Prerendering reads from Supabase in Seoul while the build runs in the US,
  // and twelve pages render at once. The 60s default is not much headroom for
  // that many cross-Pacific round trips.
  staticPageGenerationTimeout: 180,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
