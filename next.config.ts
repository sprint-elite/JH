import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/products/list/ecobag",
        destination: "/products/list/tee",
        permanent: true,
      },
      {
        source: "/products/list/shopping-bag",
        destination: "/products/list/polo",
        permanent: true,
      },
      {
        source: "/products/list/pouch",
        destination: "/products/list/hoodie",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
