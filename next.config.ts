import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/chemi-gancxadebebi",
        destination: "/profile",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
