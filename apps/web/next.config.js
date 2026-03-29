/** @type {import('next').NextConfig} */
const API_PROXY_TARGET = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.flowpilotgroup.com"
).replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;