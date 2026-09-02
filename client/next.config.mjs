/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  cleanDistDir: true,
  distDir: process.env.NODE_ENV === 'production' ? '.next-build' : '.next',
};

export default nextConfig;
