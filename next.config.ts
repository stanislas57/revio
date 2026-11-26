import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Document import (relevé de notes): the file travels in a Server Action, 4 MB at most (checked again on the server).
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
