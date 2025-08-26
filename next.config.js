/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output for multitenant compatibility
  experimental: {
    appDir: true,
  },
  // Add allowed dev origins for cross-origin requests
  allowedDevOrigins: ['*.launchkit.stratxi.com'],
  // Disable telemetry for cleaner logs
  telemetry: false,
  // Ensure proper asset handling in multitenant environment
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
}

module.exports = nextConfig