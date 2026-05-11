import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fleethq-media.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'backend.fleethq.io',
      },
    ],
  },
  // Enable typed routes when all pages are created
  // experimental: {
  //   typedRoutes: true,
  // },
};

export default nextConfig;
