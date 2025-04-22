import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['image.tmdb.org', 'media4.giphy.com', 'media3.giphy.com', 'media2.giphy.com', 'media1.giphy.com', 'media0.giphy.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:3333/api/:path*',
      },
    ]
  },
};



export default nextConfig;
