import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Ensure SSE connections work properly
  experimental: {},
  // Headers for CORS and SSE
  async headers() {
    return [
      {
        source: '/api/events',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
