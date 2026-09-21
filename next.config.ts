import type { NextConfig } from "next";

// When set, requests to /api/* on this site are forwarded to the backend
// (e.g. http://my-load-balancer.amazonaws.com). The browser then only
// talks to this site over HTTPS, so there's no mixed content, no CORS,
// and the login cookies are first-party.
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
