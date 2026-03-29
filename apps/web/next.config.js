/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production";

const API_PROXY_TARGET = isProduction
  ? "https://api.flowpilotgroup.com"
  : "http://localhost:4000";

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