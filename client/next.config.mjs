/** @type {import('next').NextConfig} */
const buildId = process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID || Date.now().toString();

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*', '172.30.96.180', 'localhost:3000', '*.loca.lt', '*.ngrok-free.app', '*.ngrok.io'],
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: buildId,
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*',
        },
      ];
    }
    return [];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

