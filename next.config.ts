import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only bundle the specific icons/components each file actually imports
  // instead of the whole package — cuts dev compile time and page weight
  // for these larger, frequently-used dependencies.
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
