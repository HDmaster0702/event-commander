import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['discord.js', '@discordjs/ws', 'zlib-sync', 'utf-8-validate', 'bufferutil'],
  output: 'standalone',
};

export default nextConfig;
