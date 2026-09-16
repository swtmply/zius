import "@zius/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  // ponytail: vercel.json `services` multi-service routing never registers the
  // platform /_next/image endpoint, so the catch-all rewrite lands optimizer
  // requests on Next (whose optimizer Vercel strips) and they 404. These are
  // static screenshots in public/ — serve them raw. Drop this if the images
  // ever get big enough to need resizing/webp.
  images: { unoptimized: true },
};

export default nextConfig;
