/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*', '172.30.96.180', 'localhost:3000', '*.loca.lt', '*.ngrok-free.app', '*.ngrok.io'],
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
};

export default nextConfig;
