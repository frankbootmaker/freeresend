import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    'pg',
    'acme-client',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-ses',
    '@aws-sdk/client-iam',
    '@smithy/credential-provider-imds',
  ],
  images: {
    unoptimized: true
  }
};

export default nextConfig;
