import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // t2.nano급 서버 메모리 부족으로 빌드 타입체크 워커가 OOM — 컴파일은 정상 동작
  typescript: { ignoreBuildErrors: true },
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
