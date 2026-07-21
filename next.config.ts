import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/recipes",
        destination: "/",
      },
      {
        source: "/planner",
        destination: "/",
      },
      {
        source: "/shopping",
        destination: "/",
      },
      {
        source: "/pantry",
        destination: "/",
      },
      {
        source: "/profile",
        destination: "/",
      },
      {
        source: "/reminders",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;