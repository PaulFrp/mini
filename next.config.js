/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Output standalone for production with FastAPI serving
  output: 'standalone',
  // Disable image optimization for simpler deployment
  images: {
    unoptimized: true,
  },
    // Trailing slashes for static export compatibility
    trailingSlash: true,
  // Environment variables available to the browser
  // When NEXT_PUBLIC_BACKEND_URL is set to empty string, it means same-origin (unified deployment)
  // When undefined, fallback to localhost:8000 for dev
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_WS_BASE_URL: process.env.NEXT_PUBLIC_WS_BASE_URL,
  },
}

module.exports = nextConfig
