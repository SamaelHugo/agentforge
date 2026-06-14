/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // The project ships without an ESLint config; don't fail builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
