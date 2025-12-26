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
    // In production (unified deployment), these will be empty/same origin
  env: {
      // Use empty string in production so URLs are relative (same origin)
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    NEXT_PUBLIC_WS_BASE_URL: process.env.NEXT_PUBLIC_WS_BASE_URL || '',
  },
}

module.exports = nextConfig
