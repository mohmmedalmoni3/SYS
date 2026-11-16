import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained Next.js server for the Electron desktop bundle.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts", "date-fns"],
  },
  serverExternalPackages: ["bcryptjs"],
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
