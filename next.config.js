/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep mongoose / jsonwebtoken on the server only (they use Node.js APIs)
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'jsonwebtoken', 'bcryptjs'],
  },
};

module.exports = nextConfig;
