import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'acme-client'],
  images: {
    unoptimized: true
  }
};

export default nextConfig;
